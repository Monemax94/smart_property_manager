import { injectable, inject } from 'inversify';
import Stripe from 'stripe';
import { IWallet} from "../models/Wallet";
import { IStripeWalletRepository } from '../repositories/StripeWalletRepository';
import { TYPES } from '../config/types';

export interface IStripeWalletService {
    createStripeCustomer(wallet: IWallet, user: any): Promise<string>;
    addStripePaymentMethod(stripeCustomerId: string, paymentMethodId: string): Promise<Stripe.PaymentMethod>;
    removeStripePaymentMethod(paymentMethodId: string): Promise<void>;
    createPaymentIntent(stripeCustomerId: string, amount: number, paymentMethodId: string): Promise<Stripe.PaymentIntent>;
    confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
    refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund>;
  }
  
  @injectable()
  export class StripeWalletService implements IStripeWalletService {
    constructor(
      @inject(TYPES.StripeWalletRepository) private stripeRepo: IStripeWalletRepository
    ) {}
  
    async createStripeCustomer(wallet: IWallet, user: any): Promise<string> {
      return this.stripeRepo.createStripeCustomer(wallet, user);
    }
  
    async addStripePaymentMethod(stripeCustomerId: string, paymentMethodId: string): Promise<Stripe.PaymentMethod> {
      return this.stripeRepo.addStripePaymentMethod(stripeCustomerId, paymentMethodId);
    }
  
    async removeStripePaymentMethod(paymentMethodId: string): Promise<void> {
      return this.stripeRepo.removeStripePaymentMethod(paymentMethodId);
    }
  
    async createPaymentIntent(stripeCustomerId: string, amount: number, paymentMethodId: string): Promise<Stripe.PaymentIntent> {
      return this.stripeRepo.createPaymentIntent(stripeCustomerId, amount, 'USD');
    }
  
    async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
      return this.stripeRepo.confirmPaymentIntent(paymentIntentId);
    }
  
    async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
      return this.stripeRepo.refund(paymentIntentId, amount);
    }
  }
  