import axios, { AxiosResponse } from 'axios';
import { Types } from 'mongoose';
import { IPaymentTransaction, PaymentTransactionModel, TransactionStatus, PaymentProvider, CurrencyCode, TransactionType } from '../models/Payments';
import logger from '../utils/loggers';
import { PAYSTACK_SECRET_KEY, PAYSTACK_API_URL } from '../secrets';
import crypto from 'crypto';
import {
  PaystackInitializeResponse,
  PaystackWebhookEvent,
  PaystackVerifyResponse,
  PaystackRefundResponse
} from "../interfaces/IPayment"
import { ApiError } from '../utils/ApiError';

import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { IPaymentRepository } from '../repositories/PaymentRepository';



@injectable()
export class PaystackService {
  constructor(
    // @inject(TYPES.PaymentRepository) private repository: IPaymentRepository
    @inject(TYPES.PaymentRepository) private repository: IPaymentRepository
  ) {}

  private axiosInstance = axios.create({
    baseURL: PAYSTACK_API_URL || 'https://api.paystack.co',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY.trim()}`,
      'Content-Type': 'application/json',
    },
  });

  /**
   * Initialize a Paystack payment
   * Docs: https://paystack.com/docs/payments/accept-payments/#initialize-a-transaction
   */
  async initializePayment(
    amount: number,
    email: string,
    metadata: Record<string, any> = {},
    callbackUrl?: string
  ): Promise<PaystackInitializeResponse> {
    try {
      const response: AxiosResponse<PaystackInitializeResponse> = await this.axiosInstance.post(
        '/transaction/initialize',
        {
          email,
          amount: Math.ceil(amount * 100),
          metadata,
          callback_url: callbackUrl,
        }
      );
      // create payment basse on orderId or walletId
      if (response.status) {
        const newReference = response.data.data.reference;
    

        await this.repository.create({
          amount: Math.ceil(amount * 100),
          provider: PaymentProvider.PAYSTACK,
          status: TransactionStatus.Pending,
          user: metadata.userId,
          metadata,
          property: metadata.property,
          currency: CurrencyCode.NGN,
          transactionType: TransactionType.FeaturePayment,
          transactionId: newReference,
        } as any);
      }

      return response.data;
    } catch (error: any) {
      console.log(error)
      const errorMessage = error.response?.data?.message || 'Paystack initialization failed';
      logger.error(`Paystack payment initialization failed: ${errorMessage}`, { amount, email });
      throw ApiError.internal(errorMessage);
    }
  }

  /**
   * Verify a Paystack payment
   * Docs: https://paystack.com/docs/payments/verify-payments/
   */
  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response: AxiosResponse<PaystackVerifyResponse> = await this.axiosInstance.get(
        `/transaction/verify/${encodeURIComponent(reference)}`
      );
      return response.data;
    } catch (error: any) {
      console.log("failures")
      const errorMessage = error.response?.data?.message || 'Paystack verification failed';
      logger.error(`Paystack payment verification failed: ${errorMessage}`, { reference });
      throw ApiError.internal(errorMessage);
    }
  }

  /**
   * Create a refund
   * Docs: https://paystack.com/docs/payments/refunds/#create-a-refund
   */
  async createRefund(
    transactionId: number | string,
    amount?: number,
    metadata: Record<string, any> = {}
  ): Promise<PaystackRefundResponse> {
    try {
      const response: AxiosResponse<PaystackRefundResponse> = await this.axiosInstance.post(
        '/refund',
        {
          transaction: transactionId,
          ...(amount && { amount: amount * 100 }),
          metadata,
        }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Paystack refund creation failed';
      logger.error(`Paystack refund creation failed: ${errorMessage}`, { transactionId, amount });
      throw ApiError.internal(errorMessage);
    }
  }

  /**
   * Handle Paystack webhook events
   * Docs: https://paystack.com/docs/payments/webhooks/
   */
  async handleWebhookEvent(event: PaystackWebhookEvent, signature: string, rawBody: Buffer) {
    // Verify webhook signature first
    if (!this.verifyWebhookSignature(rawBody, signature)) {
      throw ApiError.badRequest('Invalid webhook signature');
    }

    try {
      switch (event.event) {
        case 'charge.success':
          return await this.handlePaymentSuccess(event.data);

        case 'charge.failed':
          return await this.handlePaymentFailed(event.data);

        case 'refund.processed':
          return await this.handleRefundProcessed(event.data);

        default:
          logger.info(`Unhandled Paystack event type: ${event.event}`);
          return { received: true };
      }
    } catch (error) {
      logger.error(`Paystack webhook handling failed: ${error.message}`, { event });
      throw new Error('Webhook handling failed');
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(data: PaystackWebhookEvent['data']) {
    const metadata = data.metadata as { walletId?: string; orderId?: string, userId?: string };

    if (!metadata.orderId && !metadata.walletId) {
      throw ApiError.badRequest('Either orderId or walletId must be provided');
    }

    const walletId = metadata.walletId ? new Types.ObjectId(metadata.walletId) : null;
    const orderId = new Types.ObjectId(metadata.orderId);

    const session = await PaymentTransactionModel.startSession();
    session.startTransaction();
    try {


      const payment = await PaymentTransactionModel.findOneAndUpdate(
        { reference: data.reference },
        {
          $setOnInsert: {
            reference: data.reference,
            provider: PaymentProvider.PAYSTACK,
            currency: data.currency || CurrencyCode.NGN,
            metadata: data.metadata,
          },
          $set: {
            status: TransactionStatus.Completed,
            amount: data.amount / 100,
            cardDetails: this.extractCardDetails(data) || {},
            paidAt: new Date(),
          }
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          session
        }
      );
      if (!payment) {
        throw new Error('Payment record not found');
      }


      await session.commitTransaction();

      logger.info(`Payment succeeded: ${orderId}, Wallet: ${walletId || 'N/A'}`);
      return payment;
    } catch (error) {
      await session.abortTransaction();
      logger.error(`Payment success handling failed: ${error.message}`, { data });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(data: PaystackWebhookEvent['data']) {
    await PaymentTransactionModel.findOneAndUpdate(
      { reference: data.reference },
      {
        status: TransactionStatus.Failed,
        failureReason: 'Payment failed',
      }
    );
  }

  /**
   * Handle processed refund
   */
  private async handleRefundProcessed(data: PaystackWebhookEvent['data']) {
    const payment = await PaymentTransactionModel.findOneAndUpdate(
      { reference: data.reference },
      {
        status: TransactionStatus.Refunded,
        amountRefunded: data.amount / 100, // Convert from kobo
      }
    );

    if (!payment) {
      logger.error('Payment record not found for refund', { data });
      return;
    }


    logger.info(`Payment refunded: ${payment._id}`);
  }

  /**
   * Extract card details from Paystack response
   */
  private extractCardDetails(data: PaystackWebhookEvent['data']) {
    if (!data.authorization) return;
    return {
      last4: data.authorization.last4,
      brand: data.authorization.brand,
      cardType: data.authorization.card_type,
    };
  }

  /**
   * Verify Paystack webhook signature
   * Docs: https://paystack.com/docs/payments/webhooks/#verifying-a-webhook
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      throw new Error('PAYSTACK_SECRET_KEY not configured');
    }

    const calculatedSignature = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    return calculatedSignature === signature;
  }


  /**
 * Verify payment manually (for when webhooks fail)
 */
  async verifyPaymentAndUpdate(reference: string): Promise<IPaymentTransaction> {
    try {
      const verification = await this.verifyPayment(reference);
      if (verification.data.status !== 'success') {
        throw ApiError.internal(`Payment not succeeded. Current status: ${verification.data.status}`);
      }

      const metadata = verification.data.metadata as {
        userId?: string;
        walletId?: string;
        orderId?: string
      };

      const orderId = metadata.orderId ? new Types.ObjectId(metadata.orderId) : null;
      const walletId = metadata.walletId ? new Types.ObjectId(metadata.walletId) : null;

      // Prepare payment data
      const paymentData = {
        status: TransactionStatus.Completed,
        reference: verification.data.reference,
        provider: PaymentProvider.PAYSTACK,
        currency: verification.data.currency as CurrencyCode,
        amount: verification.data.amount,
        order: orderId,
        wallet: walletId,
        paidAt: new Date(verification?.data?.paid_at),
        cardDetails: {
          last4: verification?.data?.authorization?.last4,
          brand: verification?.data?.authorization?.brand,
        },
        metadata: {
          ...verification?.data?.metadata,
          authorization: verification?.data?.authorization,
          customer: verification?.data?.customer
        },
      };

      // Find existing payment and create/update in parallel
      const  payment = await this.findAndUpsertPayment(
        reference,
        paymentData
      );

      if (!payment) {
        throw ApiError.validationError('Failed to create or update payment record');
      }

      // Get populated payment
      const populatedPayment = await this.repository.findById(payment._id.toString());
      return populatedPayment!;
    } catch (error) {
      logger.error(`Payment verification failed: ${error.message}`, { reference });
      // Re-throw the original error if it is already a known ApiError type.
      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Payment verification failed: ${error.message}`);
    }
  }

  /**
 * Find existing payment and upsert (create or update)
 */
  async findAndUpsertPayment(
    reference: string,
    paymentData: any
  ): Promise<IPaymentTransaction | null> {
    // let payments: IPayment[] = [];
    let payment: IPaymentTransaction;

 
    const upsertedPayment = await PaymentTransactionModel.findOneAndUpdate(
      { reference },
      { $set: paymentData },
      {
        new: true,
        upsert: true,      // ← atomically create if not found
        setDefaultsOnInsert: true,
      }
    );
    return  upsertedPayment;
  }
  /**
  * Handle results from parallel operations
  */
  private handleParallelOperationResults(
    walletResult: PromiseSettledResult<any>,
    orderResult: PromiseSettledResult<any>
  ): void {
    const errors: string[] = [];

    if (walletResult.status === 'rejected') {
      const error = `Wallet update failed: ${walletResult.reason.message}`;
      logger.error(error);
      errors.push(error);
    }

    if (orderResult.status === 'rejected') {
      const error = `Order update failed: ${orderResult.reason.message}`;
      logger.error(error);
      errors.push(error);
    }

    if (errors.length > 0) {
      logger.warn(`Partial failures during payment verification: ${errors.join('; ')}`);
    }
  }


}
