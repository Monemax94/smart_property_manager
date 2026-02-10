import Stripe from 'stripe';
import { WalletModel, IWallet,} from "../models/Wallet";
import logger from "../utils/loggers";
import { STRIPE_API_KEY } from '../secrets';


export interface IStripeWalletRepository {
  createStripeCustomer(wallet: IWallet, user: any): Promise<string>;
  addStripePaymentMethod(stripeCustomerId: string, paymentMethodId: string): Promise<Stripe.PaymentMethod>;
  removeStripePaymentMethod(paymentMethodId: string): Promise<void>;
  createPaymentIntent(stripeCustomerId: string, amount: number, currency: string): Promise<Stripe.PaymentIntent>;
  confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
  getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
  refund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund>;
}

export class StripeWalletRepository implements IStripeWalletRepository {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(STRIPE_API_KEY|| '', {
      apiVersion: '2024-06-20'
    });
  }

  async createStripeCustomer(wallet: IWallet, user: any): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user?.profile?.firstName || user.email,
        metadata: {
          walletId: wallet._id.toString(),
          userId: wallet.userId.toString()
        }
      });

      logger.info(`Stripe customer created: ${customer.id} for wallet ${wallet._id}`);
      return customer.id;
    } catch (error: any) {
      logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  async addStripePaymentMethod(stripeCustomerId: string, paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });

      logger.info(`Payment method ${paymentMethodId} attached to customer ${stripeCustomerId}`);
      return paymentMethod;
    } catch (error: any) {
      logger.error('Error attaching payment method:', error);
      throw error;
    }
  }

  async removeStripePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      logger.info(`Payment method ${paymentMethodId} detached`);
    } catch (error: any) {
      logger.error('Error detaching payment method:', error);
      throw error;
    }
  }

  async createPaymentIntent(stripeCustomerId: string, amount: number, currency: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: stripeCustomerId,
        statement_descriptor: 'Wallet Funding'
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error: any) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      logger.info(`Payment intent confirmed: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error: any) {
      logger.error('Error confirming payment intent:', error);
      throw error;
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error: any) {
      logger.error('Error retrieving payment intent:', error);
      throw error;
    }
  }

  async refund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      logger.info(`Refund created: ${refund.id} for payment intent ${paymentIntentId}`);
      return refund;
    } catch (error: any) {
      logger.error('Error creating refund:', error);
      throw error;
    }
  }
}