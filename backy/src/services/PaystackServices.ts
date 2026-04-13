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
import { ApplicationModel } from '../models/Application';
import { PropertyModel } from '../models/Property';



@injectable()
export class PaystackService {
  constructor(
    // @inject(TYPES.PaymentRepository) private repository: IPaymentRepository
    @inject(TYPES.PaymentRepository) private repository: IPaymentRepository
  ) { }

  private getRequestConfig() {
    // Ensure PAYSTACK_API_URL is not overriding the default incorrectly
    const baseURL = PAYSTACK_API_URL || 'https://api.paystack.co';

    // Test secret key format (should start with 'sk_' or 'sk_test_')
    const secretKey = PAYSTACK_SECRET_KEY?.trim();

    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not set');
    }

    if (!secretKey.startsWith('sk_')) {
      console.warn('Paystack secret key has unexpected format. Should start with "sk_"');
    }

    return {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      baseURL,
    };
  }

  /**
   * Initialize a Paystack payment
   * Docs: https://paystack.com/docs/payments/accept-payments/#initialize-a-transaction
   */
  /**
   * Initialize a Paystack payment
   * Docs: https://paystack.com/docs/payments/accept-payments/#initialize-a-transaction
   */
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
    const config = this.getRequestConfig();
    const payload: any = {
      email,
      amount: Math.ceil(amount * 100),
      metadata,
    };
    if (callbackUrl) {
      payload.callback_url = callbackUrl;
    }

    console.log('Sending to Paystack:', {
      url: `${config.baseURL}/transaction/initialize`,
      payload,
      hasAuth: !!config.headers.Authorization
    });

    const response: AxiosResponse<PaystackInitializeResponse> = await axios.post(
      `${config.baseURL}/transaction/initialize`,
      payload,
      { headers: config.headers }
    );

    // create payment based on orderId or walletId
    if (response.data.status) {
      const newReference = response.data.data.reference;

      await this.repository.create({
        amount: amount,
        provider: PaymentProvider.PAYSTACK,
        status: TransactionStatus.Pending,
        user: metadata.userId?.toString() || metadata.userId,
        metadata,
        property: metadata.propertyId || metadata.property,
        currency: CurrencyCode.NGN,
        transactionType: TransactionType.FeaturePayment,
        transactionId: newReference,
      } as any);
    }

    // ✅ FIX: Return the response data
    return response.data;
    
  } catch (error: any) {
    console.error('Paystack initialization error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    const errorMessage = error.response?.data?.message || error.message || 'Paystack initialization failed';
    logger.error(`Paystack initialization failed for ${email}: ${errorMessage}`, {
      amount,
      keyUsed: process.env.PAYSTACK_SECRET_KEY ? `${process.env.PAYSTACK_SECRET_KEY.substring(0, 10)}...` : 'not-found'
    });
    
    // This throws an error, which is fine - it doesn't need to return
    throw ApiError.internal(errorMessage);
  }
}
  /**
   * Verify a Paystack payment
   * Docs: https://paystack.com/docs/payments/verify-payments/
   */
  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const config = this.getRequestConfig();
      const response: AxiosResponse<PaystackVerifyResponse> = await axios.get(
        `${config.baseURL}/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: config.headers }
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
      const config = this.getRequestConfig();
      const response: AxiosResponse<PaystackRefundResponse> = await axios.post(
        `${config.baseURL}/refund`,
        {
          transaction: transactionId,
          ...(amount && { amount: amount * 100 }),
          metadata,
        },
        { headers: config.headers }
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
      console.error('Webhook signature verification failed');
      throw ApiError.badRequest('Invalid webhook signature');
    }

    console.log('Webhook Event Data:', JSON.stringify(event, null, 2));

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
    const metadata = data.metadata as { propertyId?: string, userId?: string, applicationId?: string };

    if (!metadata.propertyId) {
      throw ApiError.badRequest('propertyId must be provided in metadata');
    }

    const propertyId = new Types.ObjectId(metadata.propertyId);

    const session = await PaymentTransactionModel.startSession();
    session.startTransaction();
    try {


      const payment = await PaymentTransactionModel.findOneAndUpdate(
        { transactionId: data.reference },
        {
          $setOnInsert: {
            transactionId: data.reference,
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

      if (metadata.applicationId) {
        await ApplicationModel.findByIdAndUpdate(metadata.applicationId, {
          paymentStatus: 'completed'
        });
      }

      // Mark property as reserved
      await PropertyModel.findByIdAndUpdate(propertyId, {
        status: 'reserved'
      });

      logger.info(`Payment succeeded for property: ${propertyId}`);
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
      { transactionId: data.reference },
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
        propertyId?: string;
        applicationId?: string;
      };

      const propertyId = metadata.propertyId ? new Types.ObjectId(metadata.propertyId) : null;

      // Prepare payment data
      const paymentData = {
        status: TransactionStatus.Completed,
        transactionId: verification.data.reference,
        provider: PaymentProvider.PAYSTACK,
        currency: verification.data.currency as CurrencyCode,
        amount: verification.data.amount / 100, // Paystack amount is in kobo
        property: propertyId,
        user: metadata.userId ? new Types.ObjectId(metadata.userId) : null,
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
      const payment = await this.findAndUpsertPayment(
        reference,
        paymentData
      );

      if (!payment) {
        throw ApiError.validationError('Failed to create or update payment record');
      }

      if (metadata.applicationId) {
        await ApplicationModel.findByIdAndUpdate(metadata.applicationId, {
          paymentStatus: 'completed'
        });
      }

      if (propertyId) {
        await PropertyModel.findByIdAndUpdate(propertyId, { status: 'reserved' });
      }

      // Get populated payment
      return payment;
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
      { transactionId: reference },
      { $set: paymentData },
      {
        new: true,
        upsert: true,      // ← atomically create if not found
        setDefaultsOnInsert: true,
      }
    );
    return upsertedPayment;
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
