import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { OrderRepository, CreateOrderDto } from '../repositories/OrderRepository';
import { Types } from 'mongoose';
import { TransactionStatus } from '../models/Payments';


@injectable()
export class OrderService {
  constructor(
    @inject(TYPES.OrderRepository) private orderRepo: OrderRepository
  ) {}

  create(userId: string, addressId: string) {
    return this.orderRepo.createOrderFromCart(userId, addressId);
  }
  createBulk(userId: string, addressId: string, vendorId?: string) {
    return this.orderRepo.createOrderFromCartBulk(userId, addressId, vendorId);
  }

  findAll(userId?: Types.ObjectId,
    page: number = 1,
    limit: number = 10,
    filters: Record<string, any> = {}) {
    return this.orderRepo.findAll(userId?.toString(), page, limit, filters);
  }

  findById(id: string) {
    return this.orderRepo.findById(id);
  }

  getOrderStatistics (userId?: string) {
    return this.orderRepo.getOrderStatistics(userId)
  }
  update(id: string, data: Partial<CreateOrderDto>) {
    return this.orderRepo.update(id, data);
  }
  
  bulkUpdateOrdersPaymentStatus(id: Types.ObjectId[], status: TransactionStatus) {
    return this.orderRepo.bulkUpdateOrdersPaymentStatus(id, status);
  }

  delete(id: string) {
    return this.orderRepo.delete(id);
  }
  counter() {
    return this.orderRepo.counter();
  }
  
}
