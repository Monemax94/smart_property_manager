import { Request, Response } from 'express';
import Stripe from 'stripe';
import { injectable, inject } from 'inversify';
import { STRIPE_WEBHOOK_SECRET, STRIPE_API_KEY, SUPPORT_EMAIL } from "../secrets";
import { CurrencyCode, PaymentProvider, TransactionStatus, TransactionType } from '../models/Payments';
import { TYPES } from "../config/types";

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
import { PropertyService } from '../services/PropertyService';
import { PaystackService } from '../services/PaystackServices';
import { IPaymentRepository } from '../repositories/PaymentRepository';

@injectable()
export class PaymentController {

    constructor(
        @inject(TYPES.PropertyService) private propertyService: PropertyService,
        @inject(TYPES.UserService) private userService: UserService,
        @inject(TYPES.PaystackService) private paystackService: PaystackService,
        @inject(TYPES.PaymentRepository) private paymentRepository: IPaymentRepository,

    ) { }
    createPaymentIntent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        /* #swagger.tags = ['Payment'] */
        /* #swagger.summary = 'create payment intent' */

        const {
            currency = CurrencyCode.NGN,
            propertyId,
            paymentGateWay = PaymentProvider.PAYSTACK,
            callback_url,
            failedUrl
        } = req.body;

        const email = req.user.email;
        const userId = req.user._id.toString();

        if (!propertyId) {
            throw ApiError.badRequest('propertyId is required');
        }

        const props = await this.propertyService.getPropertyById(propertyId);
        if (!props) {
            throw ApiError.notFound('Order not found');
        }
        let amountinNaira = props.pricing.rentPrice;

        // extract customer name and email
        const user = await this.userService.getUserById(userId as any)
        if (!user) {
            throw ApiError.notFound('User not found');
        }
        // const customer_name = `${user.profile.firstName} ${user.profile.lastName}`;
        const customer_name = user.email;
        const customer_email = user.email;

        let paymentResult;

        // Get callback URL with fallback logic
        const finalCallbackUrl = callback_url

        // Handle payment based on selected gateway
        switch (paymentGateWay) {
            //   case PaymentProvider.STRIPE:
            //     paymentResult = await PaymentStripeService.createPaymentIntent(
            //       amountDols,
            //       currency,
            //       finalCallbackUrl,
            //       {
            //         userId,
            //         orderId,
            //         failedUrl,
            //         customer_email,
            //         customer_name
            //       },
            //     );
            //     break;

            case PaymentProvider.PAYSTACK:
                paymentResult = await this.paystackService.initializePayment(
                    amountinNaira,
                    email,
                    {
                        userId,
                        propertyId,
                        failedUrl,
                        customer_email,
                        customer_name
                    },
                    finalCallbackUrl
                );
                break;

            default:
                throw ApiError.badRequest(
                    'Unsupported payment gateway',
                    {
                        supportedGateways: Object.values(PaymentProvider)
                    }
                );
        }
        return res.status(200).json(
            ApiResponse.success(
                {
                    gateway: paymentGateWay,
                    ...paymentResult
                }
            )
        );
    });

    verifyPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { paymentGateWay = PaymentProvider.PAYSTACK, paymentIntentId, reference } = req.body;

        if (!paymentIntentId && !reference) {
            throw ApiError.badRequest('Either paymentIntentId or reference is required');
        }

        let paymentResult;

        // Handle verification based on payment gateway
        if (paymentGateWay === PaymentProvider.STRIPE) {
            if (!paymentIntentId) {
                return res.status(400).json(ApiError.badRequest('paymentIntentId is required for Stripe verification'));
            }
            paymentResult = await this.paystackService.verifyPayment(paymentIntentId);
        } else if (paymentGateWay === PaymentProvider.PAYSTACK) {
            if (!reference) {
                return res.status(400).json(ApiError.badRequest('reference is required for Paystack verification'));
            }
            paymentResult = await this.paystackService.verifyPaymentAndUpdate(reference);
        } else {
            return res.status(400).json(ApiError.badRequest('Unsupported payment gateway'));
        }


        return res.status(200).json(
            ApiResponse.success(
                {
                    gateway: paymentGateWay,
                    payment: paymentResult
                }
            )
        );
    });



    handlePaystackWebhook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

        const signature = req.headers['x-paystack-signature'] as string;
        if (!signature) {
            return res.status(400).json({ message: 'Missing signature' });
        }
        // const event = req.body;

        const rawBody = req.body as Buffer;
        const event = JSON.parse(rawBody.toString());



        console.log('Received Paystack webhook:', {
            event: event.event,
            reference: event.data?.reference,
            signature: signature?.substring(0, 20) + '...'
        });

        if (!signature) {
            throw ApiError.unauthorized('Missing Paystack signature');
        }

        // Process the webhook event
        const result = await this.paystackService.handleWebhookEvent(
            event,
            signature,
            rawBody
        );
        // Always return 200 to acknowledge receipt
        return res.sendStatus(200);
    });

    getPaymentHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const status = req.query.status as string;

        const result = await this.paymentRepository.getUserPaymentHistory(
            userId.toString(),
            page,
            limit,
            search,
            status
        );

        return res.status(200).json(
            ApiResponse.paginated(
                result.data,
                {
                    page,
                    limit,
                    total: result.total,
                    pages: Math.ceil(result.total / limit)
                },
                'Payment history retrieved successfully'
            )
        );
    });
}