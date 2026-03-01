import { inject, injectable } from 'inversify';
import { IPaymentRepository } from '../repositories/PaymentRepository';
import { IPaymentTransaction, TransactionStatus, CurrencyCode } from '../models/Payments';
import { TYPES } from '../config/types';
import { FilterQuery, Types } from 'mongoose';

export interface IPaymentService {
  createPaymentTransaction(data: IPaymentTransaction | any, vendorOrders: Types.ObjectId[]): Promise<IPaymentTransaction>;
  updatePaymentTransaction(orderId: string, data: Partial<IPaymentTransaction> | any): Promise<IPaymentTransaction>;
  getPaymentByTransactionId(transactionId: string): Promise<IPaymentTransaction | null>;
  getPaymentsForOrder(orderId: string): Promise<IPaymentTransaction[]>;
  getPaymentById(orderId: string): Promise<IPaymentTransaction>;
  getPayment(filter:FilterQuery<IPaymentTransaction>): Promise<IPaymentTransaction>;
  updatePaymentStatus(transactionId: string, status: TransactionStatus): Promise<IPaymentTransaction | null>;
  getTransactionsByType(type: string, page?: number, limit?: number, search?: string);
  getEscrowStatus(userId: string);
}

@injectable()
export class PaymentService implements IPaymentService {
  constructor(
    @inject(TYPES.PaymentRepository) private repository: IPaymentRepository
  ) {}

  async createPaymentTransaction(data: IPaymentTransaction | any, vendorOrders: Types.ObjectId[]): Promise<IPaymentTransaction> {
    return this.repository.create(data as IPaymentTransaction);
  }
  async updatePaymentTransaction(orderId:string, data: IPaymentTransaction | any): Promise<IPaymentTransaction> {
    return this.repository.updatePayments(orderId, data);
  }

  async getPaymentByTransactionId(transactionId: string): Promise<IPaymentTransaction | null> {
    return this.repository.findByTransactionId(transactionId);
  }
  async getPayment(filter: FilterQuery<IPaymentTransaction>): Promise<IPaymentTransaction | null> {
    return this.repository.findOne(filter);
  }

  async getPaymentsForOrder(orderId: string): Promise<IPaymentTransaction[]> {
    return this.repository.findByOrderId(orderId);
  }
  async getPaymentById(orderId: string): Promise<IPaymentTransaction> {
    return this.repository.findById(orderId);
  }

  async updatePaymentStatus(
    transactionId: string,
    status: TransactionStatus
  ): Promise<IPaymentTransaction | null> {
  
    return await this.repository.updateStatus(transactionId, status);
  }
  
  getTransactionsByType(type: string, page?: number, limit?: number, search?: string) {
    return this.repository.getAllByType(type, page, limit, search);
  }

  getEscrowStatus(userId?: string) {
    return this.repository.getEscrowStats(userId);
  }
}