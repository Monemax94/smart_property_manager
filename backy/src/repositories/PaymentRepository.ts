import { injectable } from 'inversify';
import { PaymentTransactionModel, IPaymentTransaction } from '../models/Payments';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { Types } from 'mongoose';
export interface IPaymentRepository {
  create(payment: IPaymentTransaction, vendorOrders: Types.ObjectId[]): Promise<IPaymentTransaction>;
  getAllByType(type: string, page: number, limit: number, search?: string): Promise<{ data: IPaymentTransaction[]; total: number }>;
  getEscrowStats(userId?: string);
  updatePayments(orderId: string, payment: Partial<IPaymentTransaction>): Promise<IPaymentTransaction>;
  findByTransactionId(transactionId: string): Promise<IPaymentTransaction | null>;
  findByOrderId(orderId: string): Promise<IPaymentTransaction[]>;
  findById(orderId: string): Promise<IPaymentTransaction>;
  updateStatus(transactionId: string, status: string): Promise<IPaymentTransaction | null>;
  updatePaymentStatus(order: string, status: string): Promise<IPaymentTransaction | null>;
  findOne(filter: FilterQuery<IPaymentTransaction>): Promise<IPaymentTransaction | null>;
  update(filter: FilterQuery<IPaymentTransaction>, update: UpdateQuery<IPaymentTransaction>): Promise<IPaymentTransaction | null>;
  getPaymentsByOrderIds(orderIds: Types.ObjectId[]): Promise<IPaymentTransaction[]>;
}

@injectable()
export class PaymentRepository implements IPaymentRepository {
  async create(paymentData: IPaymentTransaction, vendorOrders: Types.ObjectId[]): Promise<IPaymentTransaction> {


    return await PaymentTransactionModel.create({
      orders: vendorOrders.map(o => o._id),
      user: paymentData.user,
      amount: paymentData.amount,
      currency: paymentData.currency,
      paymentMethod: paymentData.paymentMethod,
      transactionId: paymentData.transactionId,
      status: paymentData.status,
      transactionType: paymentData.transactionType,
      gatewayResponse: paymentData.gatewayResponse,
      metadata: paymentData?.metadata
    });

  }
  // async updatePayments(orderId: string, payment: Partial<IPaymentTransaction>): Promise<IPaymentTransaction | null> {
  //   return PaymentTransactionModel.findByIdAndUpdate(
  //     orderId,
  //     { status },
  //     { new: true }
  //   );
  // }

  async updatePayments(
    orderId: string,
    payment: Partial<IPaymentTransaction>
  ): Promise<IPaymentTransaction | null> {

    if (!payment.status) {
      throw new Error("Status is required");
    }

    return PaymentTransactionModel.findByIdAndUpdate(
      orderId,
      { status: payment.status },
      { new: true }
    );
  }


  async findByTransactionId(transactionId: string): Promise<IPaymentTransaction | null> {
    return PaymentTransactionModel.findOne({ transactionId });
  }

  async findByOrderId(orderId: string): Promise<IPaymentTransaction[]> {
    return PaymentTransactionModel.find({ order: orderId });
  }
  async findById(orderId: string): Promise<IPaymentTransaction> {
    // return PaymentTransactionModel.findById(orderId);
    return PaymentTransactionModel.findById(orderId)
      .populate({
        path: 'orders',
        populate: [
          {
            path: 'products.product',
            populate: {
              path: 'vendorId',
              model: 'Vendor'
            }
          },
          { path: 'shippingAddress' },
          { path: 'billingAddress' }
        ]
      })
      .populate({
        path: 'user',
        populate: {
          path: 'profile',
          model: 'Profile'
        }
      });
  }

  async updateStatus(transactionId: string, status: string): Promise<IPaymentTransaction | null> {
    return PaymentTransactionModel.findOneAndUpdate(
      { transactionId },
      { status },
      { new: true }
    );
  }
  async updatePaymentStatus(order: string, status: string): Promise<IPaymentTransaction | null> {
    return PaymentTransactionModel.findOneAndUpdate(
      { order },
      { status },
      { new: true }
    );
  }

  async findOne(filter: FilterQuery<IPaymentTransaction>): Promise<IPaymentTransaction | null> {
    return PaymentTransactionModel.findOne(filter);
  }

  async update(filter: FilterQuery<IPaymentTransaction>, update: UpdateQuery<IPaymentTransaction>): Promise<IPaymentTransaction | null> {
    return PaymentTransactionModel.findOneAndUpdate(filter, update, { new: true });
  }
  async getPaymentsByOrderIds(orderIds: Types.ObjectId[]): Promise<IPaymentTransaction[]> {
    if (orderIds.length === 0) return [];

    return PaymentTransactionModel.find({
      orders: { $in: orderIds }
    })
      .select('-gatewayResponse -__v')
      .exec();
  }

  async getAllByType(
    type: string,
    page = 1,
    limit = 10,
    search = ''
  ): Promise<{ data: IPaymentTransaction[]; total: number }> {
    const query = {
      transactionType: type,
      ...(search && {
        $or: [
          { transactionId: { $regex: search, $options: 'i' } },
          { status: { $regex: search, $options: 'i' } },
        ]
      })
    };

    const total = await PaymentTransactionModel.countDocuments(query);
    const data = await PaymentTransactionModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'orders',
        populate: [
          {
            path: 'products.product',
            populate: {
              path: 'vendorId',
              model: 'Vendor'
            }
          },
          { path: 'shippingAddress' },
          { path: 'billingAddress' }
        ]
      })
      .populate({
        path: 'user',
        populate: {
          path: 'profile',
          model: 'Profile'
        }
      });
    return { data, total };
  }


  async getEscrowStats(userId?: string) {
    const matchBase = userId ? { user: userId } : {};

    const [escrowHeld = { total: 0 }] = await PaymentTransactionModel.aggregate([
      { $match: { ...matchBase, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const [released = { total: 0 }] = await PaymentTransactionModel.aggregate([
      { $match: { ...matchBase, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const [pendingRelease = { total: 0 }] = await PaymentTransactionModel.aggregate([
      { $match: { ...matchBase, status: 'disputed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      escrowHeld: escrowHeld.total,
      released: released.total,
      pendingRelease: pendingRelease.total,
    };
  }
}