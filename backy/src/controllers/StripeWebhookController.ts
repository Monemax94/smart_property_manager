import { Request, Response } from 'express';
import Stripe from 'stripe';
import { injectable, inject } from 'inversify';
import { STRIPE_WEBHOOK_SECRET, STRIPE_API_KEY, SUPPORT_EMAIL } from "../secrets";
import { CurrencyCode, PaymentMethod, TransactionStatus, TransactionType } from '../models/Payments';
import { TYPES } from "../config/types";
import { OrderService } from '../services/OrderService';
import { OrderStatus, PaymentStatus } from '../models/OrderModel';
import { PaymentService } from '../services/paymentService';
import { Types } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { AuthenticatedRequest } from '../types/customRequest';
import loggers from '../utils/loggers';
import { emailTemplates } from '../utils/mails.template';
import { UserService } from '../services/UserService';
import { IProfileDocument } from '../models/Profile';
import sendMail from '../utils/mailer';

@injectable()
export class StripeWebhookController {
    private stripe = new Stripe(STRIPE_API_KEY, { apiVersion: '2024-06-20' });

    constructor(
        @inject(TYPES.OrderService) private orderService: OrderService,
        @inject(TYPES.UserService) private userService: UserService,
        @inject(TYPES.PaymentService) private paymentService: PaymentService,

    ) { }

    /**
     * Create a payment intent for the user's CART (multi-vendor)
     * Request body: { userId, addressId, vendorId }
     */
    createPaymentForCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { addressId, vendorId } = req.body;
        const userId = req.user._id;
        if (!addressId || !Types.ObjectId.isValid(addressId)) {
            return res.status(400).json(ApiError.badRequest('Invalid or missing address id'));
        }

        if (vendorId && !Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json(ApiError.badRequest('Invalid vendor id'));
        }

        const cartResponse = await this.cartService.getCart(userId.toString());
        if (!cartResponse || !cartResponse.rawCart || cartResponse.rawCart.items.length === 0) {
            return res.status(400).json(ApiError.badRequest('Cart is Empty'));
        }

        // Identify vendor group to compute payment target
        let payableVendorGroups = cartResponse.vendorGroups;

        let isVendorPayment = false;
        if (vendorId) {
            isVendorPayment = true;
            payableVendorGroups = cartResponse.vendorGroups.filter(
                g => g.vendorId === vendorId
            );

            if (payableVendorGroups.length === 0) {
                return res.status(400).json(ApiError.badRequest(`No items found for vendorId: ${vendorId}`))
            }
        }

        const totalAmount = payableVendorGroups.reduce((acc, group) => {
            const groupTotal = group.items.reduce(
                (s, it) => s + (it.verifiedPrice * it.quantity),
                0
            );
            return acc + groupTotal;
        }, 0);

        // const amountInCents = Math.round(totalAmount * 100);
        const { serviceFee, serviceFeeRate } = await this.commissionRepo.calculateServiceFee(totalAmount);
        const finalAmount = totalAmount + serviceFee;
        const amountInCents = Math.round(finalAmount * 100);

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            // capture_method: 'manual',
            automatic_payment_methods: { enabled: true },
            metadata: {
                intentType: 'cart_payment',
                userId: userId.toString(),
                addressId,
                serviceFee: serviceFee.toString(),
                serviceFeeRate: serviceFeeRate?.toString() || "0",
                // meaning a single vendor
                isVendorPayment: isVendorPayment ? "true" : "false",
                vendorId: vendorId || ""
            }
        });

        // Save payment record
        const paymentRecord = await this.paymentService.createPaymentTransaction({
            orders: [],
            user: userId,
            currency: CurrencyCode.USD || 'USD',
            paymentMethod: PaymentMethod.Stripe,
            transactionId: paymentIntent.id,
            status: TransactionStatus.Pending,
            gatewayResponse: paymentIntent,
            transactionType: TransactionType.Order,
            amount: finalAmount,
            metadata: {
                addressId,
                isVendorPayment,
                vendorId: vendorId || null,
                serviceFee,
                serviceFeeRate
            }
        }, []);

        return res.json(
            new ApiResponse(
                200,
                { clientSecret: paymentIntent.client_secret, paymentIntent, paymentRecord },
                'Payment intent created'
            )
        );
    });


    /**
     * Verify Stripe Payment Intent
     */
    verifyPaymentIntent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { intentId } = req.body;
        if (!intentId) {
            return res.status(400).json(ApiError.badRequest('Payment intent id is required'));
        }

        // 1) Retrieve intent from Stripe
        const intent = await this.stripe.paymentIntents.retrieve(intentId);

        if (!intent) {
            return res.status(404).json(ApiError.notFound('Invalid payment intent'));
        }

        // Get payment record from DB
        const paymentRecord = await this.paymentService.getPaymentByTransactionId(intent.id);

        if (!paymentRecord) {
            return res.status(404).json(ApiError.notFound('Payment record not found'));
        }

        // Stop double processing
        if (paymentRecord.orders?.length > 0) {
            return res.status(400).json(ApiError.badRequest('Orders already created for this payment'));
        }

        /*
         Nothing else runs unless payment is succeeded
         */
        if (intent.status !== 'succeeded') {
            let status = TransactionStatus.Pending;

            if (intent.status === 'canceled') {
                status = TransactionStatus.Canceled;
            }

            if (intent.status === 'processing') {
                status = TransactionStatus.Pending;
            }

            await this.paymentService.updatePaymentTransaction(
                paymentRecord._id.toString(),
                {
                    status,
                    gatewayResponse: intent
                }
            );

            return res.json(
                ApiResponse.success({
                    stripeStatus: intent.status,
                    message: 'Payment not completed yet'
                })
            );
        }

        // FROM HERE DOWN IS "SUCCEEDED ONLY"
        const userId = paymentRecord.user;
        const addressId = paymentRecord.metadata?.addressId;
        const vendorId = paymentRecord.metadata?.vendorId || null;
        const isVendorPayment =
            paymentRecord.metadata?.isVendorPayment === true ||
            paymentRecord.metadata?.isVendorPayment === "true";

        let createdOrders;

        try {
            createdOrders = await this.orderService.createBulk(
                userId.toString(),
                addressId,
                isVendorPayment ? vendorId : null
            );
        } catch (error) {
            await this.paymentService.updatePaymentTransaction(paymentRecord._id.toString(), {
                status: TransactionStatus.Failed,
                gatewayResponse: intent
            });

            return res.status(500).json(
                ApiError.internal('Order creation failed after successful payment')
            );
        }

        const orderIds = createdOrders?.orders.map(o => o?._id);

        // Update Payment Record
        await this.paymentService.updatePaymentTransaction(
            paymentRecord._id.toString(),
            {
                orders: orderIds,
                status: TransactionStatus.Completed,
                gatewayResponse: intent
            }
        );

        //  Update Orders
        const orders = await this.orderService.bulkUpdateOrdersPaymentStatus(
            orderIds,
            TransactionStatus.Completed
        );
        const address: any = createdOrders[0].shippingAddress as any;
        // get the user information
        const userInfo = await this.userService.findById(userId);
        const profile = userInfo?.profile as IProfileDocument | undefined;
        const html = emailTemplates.orderConfirmation(
            {
                recipientName: profile?.firstName,
                supportEmail: SUPPORT_EMAIL,
                orderNumber: createdOrders.length,
                items: createdOrders[0].products.map((p) => ({
                    name: (p.product as any)?.name || 'Item',
                    quantity: p.quantity,
                    price: p.priceAtPurchase,
                })),
                subtotal: createdOrders[0].summary.grandTotal,
                serviceFee: createdOrders[0].summary.serviceFee,
                shippingFee: createdOrders[0].summary.shippingFee,
                paymentMethod: PaymentMethod.Stripe,
                shippingAddress: {
                    name: address?.street || '',
                    street: address?.street || '',
                    city: address?.city || '',
                    state: address?.state || '',
                    zip: address?.zip || '',
                    country: address?.country || '',
                }
            }
        )
        await sendMail(
            userInfo?.email,
            'Verify Your Email Address',
            html,
        )

        return res.json(
            ApiResponse.success({
                orders: createdOrders,
                payment: {
                    status: 'completed',
                    paymentIntent: intent.id
                }
            })
        );
    });


    /**
     * Stripe webhook endpoint.
     */
    handleWebhook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const sig = req.headers['stripe-signature'] as string | undefined;
        if (!sig) {
            return res.status(400).json(new ApiResponse(400, null, 'Missing Stripe signature header'));
        }

        let event: Stripe.Event;
        try {
            // req.body must be raw Buffer (handled by bodyParser.raw at route)
            event = this.stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET!);
        } catch (err: any) {
            console.error('Stripe webhook signature verification failed:', err);
            return res.status(400).json(new ApiResponse(400, null, `Webhook Error: ${err.message}`));
        }

        try {
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const intent = event.data.object as Stripe.PaymentIntent;
                    const metadata = intent.metadata || {};

                    if (metadata.intentType === 'cart_payment') {
                        await this.handleCartPaymentSuccess(intent);
                    } else if (metadata.intentType === 'order') {
                        // fallback for single-order flows
                        await this.handleOrderPaymentSuccess(intent);
                    }
                    break;
                }

                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session;
                    const metadata = session.metadata || {};
                    if (metadata.intentType === 'cart_payment') {
                        // For sessions session.id are stored transactionId; 
                        // hence we try to find matching PaymentTransaction
                        await this.handleCartPaymentSuccess(session as unknown as Stripe.PaymentIntent);
                    } else if (metadata.intentType === 'order') {
                        await this.handleOrderPaymentSuccess(session as unknown as Stripe.PaymentIntent);
                    }
                    break;
                }

                case 'payment_intent.payment_failed': {
                    const intent = event.data.object as Stripe.PaymentIntent;
                    await this.handlePaymentFailed(intent);
                    break;
                }

                default:
                    loggers.info(`Unhandled Stripe event: ${event.type}`);
            }

            return res.json(new ApiResponse(200, null, 'Webhook processed'));
        } catch (err) {
            loggers.error('Error processing webhook:', err);
            // Return 200 to acknowledge receipt to stripe if you handled gracefully, otherwise 500
            return res.status(500).json(new ApiResponse(500, null, 'Internal Error'));
        }
    });

    /**
     * Handler for cart payments (multi-vendor).
     * - finds the PaymentTransaction by transactionId
     * - if orders already exist -> idempotent, skip recreation
     * - otherwise creates orders via createOrderFromCartBulk and updates the transaction
     */
    private async handleCartPaymentSuccess(paymentObj: Stripe.PaymentIntent | any) {
        const transactionId = paymentObj.id;

        const paymentRecord = await this.paymentService.getPaymentByTransactionId(transactionId);
        if (!paymentRecord) return;

        if (paymentRecord.orders?.length > 0) return; // idempotent

        const userId = paymentRecord.user?.toString();
        const addressId = paymentRecord.metadata?.addressId;
        const vendorId = paymentRecord.metadata?.vendorId || null;
        const isVendorPayment = paymentRecord.metadata?.isVendorPayment === true ||
            paymentRecord.metadata?.isVendorPayment === "true";

        // pass vendorId to order creation
        let createdOrders;

        try {
            createdOrders = await this.orderService.createBulk(
                userId,
                addressId,
                isVendorPayment ? vendorId : null    // Pay only for selected vendor if specified
            );
        } catch (err) {
            await this.paymentService.updatePaymentTransaction(paymentRecord._id.toString(), {
                status: TransactionStatus.Failed,
                gatewayResponse: paymentObj
            });
            return;
        }

        const orderIds = createdOrders.orders.map(o => o._id);

        await this.paymentService.updatePaymentTransaction(paymentRecord._id.toString(), {
            orders: orderIds,
            status: TransactionStatus.Completed,
            gatewayResponse: paymentObj
        });

        await this.orderService.bulkUpdateOrdersPaymentStatus(orderIds, TransactionStatus.Completed);
    }

    /**
     * Handler for single-order payments (legacy)
     */
    private async handleOrderPaymentSuccess(paymentObj: Stripe.PaymentIntent | any) {
        const txId = paymentObj.id;
        const metadata = paymentObj.metadata || {};
        const orderId = metadata.orderId;

        if (!orderId) {
            console.error('Missing orderId in payment metadata for transaction', txId);
            return;
        }

        // update payment record status
        const payment = await this.paymentService.getPaymentByTransactionId(txId);
        if (payment) {
            await this.paymentService.updatePaymentTransaction(payment._id.toString(), {
                status: TransactionStatus.Completed,
                gatewayResponse: paymentObj
            });

            // update the order (single-order flow)
            await this.orderService.update(orderId, {
                status: OrderStatus.PAYMENT_SUCCESS,
                paymentStatus: PaymentStatus.Paid
            });
        }
    }

    private async handlePaymentFailed(paymentObj: Stripe.PaymentIntent | any) {
        const txId = paymentObj.id;
        const payment = await this.paymentService.getPaymentByTransactionId(txId);
        if (!payment) {
            console.warn('No local payment record for failed paymentIntent', txId);
            return;
        }

        await this.paymentService.updatePaymentTransaction(payment._id.toString(), {
            status: TransactionStatus.Failed,
            gatewayResponse: paymentObj
        });

        // mark linked orders (if any) as Unpaid or keep them pending
        if (Array.isArray(payment.orders) && payment.orders.length > 0) {
            await this.orderService.bulkUpdateOrdersPaymentStatus(payment.orders, TransactionStatus.Failed);
        }
    }

    /**
     * Refund route (unchanged signature): use orderId in path, but find the payment record
     * that contains this order in its 'orders' array and is Completed.
     */
    refundPayment = asyncHandler(async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const { amount } = req.body;

        if (!Types.ObjectId.isValid(orderId)) {
            throw ApiError.badRequest('Invalid order ID format');
        }

        // find payment transaction that contains the orderId
        const paymentTransaction = await this.paymentService.getPayment({
            orders: orderId,
            status: TransactionStatus.Completed
        });

        if (!paymentTransaction) {
            throw ApiError.notFound('No completed payment found for this order');
        }

        const maxRefundable = paymentTransaction.amount - (paymentTransaction.refundedAmount || 0);
        const refundAmount = amount ? Math.min(amount, maxRefundable) : maxRefundable;

        if (refundAmount <= 0) {
            throw ApiError.badRequest('No amount available for refund');
        }

        // Create Stripe refund using payment transactionId
        const refund = await this.stripe.refunds.create({
            payment_intent: paymentTransaction.transactionId,
            amount: Math.round(refundAmount * 100),
            reason: 'requested_by_customer'
        });

        const newRefundedAmount = (paymentTransaction.refundedAmount || 0) + refundAmount;
        const isFullRefund = newRefundedAmount >= paymentTransaction.amount;

        await this.paymentService.updatePaymentTransaction(paymentTransaction._id.toString(), {
            refundedAmount: newRefundedAmount,
            status: isFullRefund ? TransactionStatus.Refunded : TransactionStatus.PartiallyRefunded,
            gatewayResponse: refund
        });

        // Update order(s) statuses appropriately (if partial refund maybe mark disputed)
        await this.orderService.update(orderId, {
            paymentStatus: isFullRefund ? PaymentStatus.Refunded : PaymentStatus.Disputed,
            status: OrderStatus.REFUNDED
        });

        res.json(new ApiResponse(200, { refund }, 'Payment refunded successfully'));
    });
}