import { injectable } from 'inversify';
import { OrderModel } from '../models/OrderModel';
import { IUser, UserModel, UserRole, UserStatus } from '../models/User';
import { IProduct, ProductModel } from '../models/Product';
import { IVendorBuyersResponse, IVendorSpecificPurchase, IBuyerVendorHistory } from '../interfaces/IBuyerRepository';
import { IProfile } from '../models/Profile';
import { Types } from 'mongoose';
import { IAddress } from '../models/Address';

export interface PurchaseHistoryFilter {
  userId: Types.ObjectId;
  status?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface BuyerStats {
  totalBuyers: number;
  totalBuyersGrowth: number;
  activeBuyers: number;
  activeBuyersGrowth: number;
  retentionRate: number;
  retentionChange: number;
}

export interface OrderItem {
  product: Types.ObjectId | IProduct;
  retailer: string;
  quantity: number;
  price: number;
}

export interface OrderStatusHistory {
  status: string;
  changedAt: Date;
  note?: string;
}

export interface IOrder extends Document {
  user: Types.ObjectId | IUser;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: Types.ObjectId | IAddress;
  billingAddress?: Types.ObjectId | IAddress;
  payment?: Types.ObjectId;
  status: string;
  statusHistory: OrderStatusHistory[];
  taxAmount: number;
  shippingCost: number;
  assignedAgent?: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// Type for populated order after .lean()
export interface LeanOrder {
  _id: Types.ObjectId;
  user: Types.ObjectId | { _id: Types.ObjectId;[key: string]: any };
  products: {
    product: any;
    quantity: number;
    priceAtPurchase: number;
  }[];
  totalAmount: number;
  shippingAddress: Types.ObjectId | (IAddress & { _id: Types.ObjectId });
  billingAddress?: Types.ObjectId | (IAddress & { _id: Types.ObjectId });
  payment?: Types.ObjectId;
  status: string;
  statusHistory: OrderStatusHistory[];
  taxAmount: number;
  shippingCost: number;
  assignedAgent?: Types.ObjectId | (IUser & { _id: Types.ObjectId });
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface TransformedOrderItem {
  product: any | null;
  quantity: number;
  priceAtPurchase: number;
}

export interface TransformedOrder {
  _id: string;
  user: string;
  products: TransformedOrderItem[];
  totalAmount: number;
  shippingAddress: any | null;
  billingAddress: any | null;
  payment?: string;
  status: string;
  statusHistory: OrderStatusHistory[];
  taxAmount: number;
  shippingCost: number;
  // assignedAgent: any | null;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class BuyerRepository {

  async countBuyers(fromDate?: Date): Promise<number> {
    const filter: any = { role: 'customer', isDeleted: false };
    if (fromDate) filter.createdAt = { $gte: fromDate };
    return UserModel.countDocuments(filter);
  }

  async countActiveBuyers(fromDate?: Date): Promise<number> {
    const filter: any = {
      role: UserRole.CUSTOMER,
      isDeleted: false,
      status: UserStatus.ACTIVE,
    };
    if (fromDate) filter.createdAt = { $gte: fromDate };
    return UserModel.countDocuments(filter);
  }

  async getRetentionRate(): Promise<number> {
    const allBuyers = await UserModel.countDocuments({
      role: UserRole.CUSTOMER,
      isDeleted: false
    });
    const retained = await UserModel.countDocuments({
      role: UserRole.CUSTOMER,
      isDeleted: false,
      loginHistory: { $exists: true, $not: { $size: 0 } },
    });
    return allBuyers > 0 ? (retained / allBuyers) * 100 : 0;
  }

  async getAllBuyersWithTotalSpent(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    // Build filter with optional search
    const filter: any = {
      role: UserRole.CUSTOMER,
      isDeleted: false,
    };

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { userID: { $regex: search, $options: 'i' } },
      ];
    }
    // Count total matching customers
    const totalItems = await UserModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch paginated and populated customers
    const customers = await UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('profile')
      .exec();

    // Compute totalSpent per customer
    const buyersWithSpent = await Promise.all(
      customers.map(async (customer) => {
        const orders = await OrderModel.find({ userId: customer._id, isDeleted: false });
        const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        return {
          buyer: {
            id: customer._id,
            email: customer.email,
            userID: customer.userID,
            firstName: (customer.profile as IProfile)?.firstName || '',
            lastName: (customer.profile as IProfile)?.lastName || '',
            address: (customer.profile as IProfile)?.address || '',
            joined: customer.createdAt,
            status: customer.status,
          },
          totalSpent,
          orderCount: orders.length,
        };
      })
    );

    //  Return paginated result
    return {
      data: buyersWithSpent,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  getOrdersByBuyer = async (
    filter: PurchaseHistoryFilter,
    skip: number,
    limit: number
  ): Promise<LeanOrder[]> => {
    const dbFilter: Record<string, any> = {
      userId: filter.userId, 
      isDeleted: false
    };

    if (filter.status) dbFilter.status = filter.status;
    if (filter.paymentStatus) dbFilter.paymentStatus = filter.paymentStatus;
    if (filter.deliveryStatus) dbFilter.deliveryStatus = filter.deliveryStatus;

    if (filter.minAmount || filter.maxAmount) {
      dbFilter.totalAmount = {};
      if (filter.minAmount) dbFilter.totalAmount.$gte = filter.minAmount;
      if (filter.maxAmount) dbFilter.totalAmount.$lte = filter.maxAmount;
    }

    if (filter.startDate || filter.endDate) {
      dbFilter.createdAt = {}; // Using createdAt instead of date
      if (filter.startDate) dbFilter.createdAt.$gte = filter.startDate;
      if (filter.endDate) dbFilter.createdAt.$lte = filter.endDate;
    }
    return await OrderModel.find(dbFilter)
    .populate({
      path: 'products',
      model: ProductModel,
      select: 'name description price discountedPrice images vendorId',
      match: { isDeleted: false }
    })
    .populate('shippingAddress billingAddress')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean() as unknown as Promise<LeanOrder[]>;
  }
  countOrdersByBuyer = async (filter: PurchaseHistoryFilter) => {
    const dbFilter: Record<string, any> = {
      userId: filter.userId,
      isDeleted: false
    };

    if (filter.status) dbFilter.status = filter.status;
    if (filter.paymentStatus) dbFilter.paymentStatus = filter.paymentStatus;
    if (filter.deliveryStatus) dbFilter.deliveryStatus = filter.deliveryStatus;

    if (filter.minAmount || filter.maxAmount) {
      dbFilter.totalAmount = {};
      if (filter.minAmount) dbFilter.totalAmount.$gte = filter.minAmount;
      if (filter.maxAmount) dbFilter.totalAmount.$lte = filter.maxAmount;
    }

    if (filter.startDate || filter.endDate) {
      dbFilter.createdAt = {}; // Using createdAt instead of date
      if (filter.startDate) dbFilter.createdAt.$gte = filter.startDate;
      if (filter.endDate) dbFilter.createdAt.$lte = filter.endDate;
    }

    return OrderModel.countDocuments(dbFilter);
  }
}