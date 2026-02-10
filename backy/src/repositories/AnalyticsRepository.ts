import { injectable } from 'inversify';
import { PaymentTransactionModel } from '../models/Payments';
import { OrderModel } from '../models/OrderModel';
import VendorModel from '../models/Vendor';


export interface MetricDTO {
    value: number | string;
    change: number;
    changeType: 'increase' | 'decrease';
}

export interface RevenueOverTimeDTO {
    date: Date | any;
    amount: number;
}

export interface TopVendorDTO {
    name: string;
    category: string;
}

export interface AnalyticsDashboardDTO {
    totalRevenue: MetricDTO;
    totalSales: MetricDTO;
    totalOrders: MetricDTO;
    activeVendors: MetricDTO;
    activeBuyers: MetricDTO;
    commissionRevenue: MetricDTO;
    pendingVerifications: MetricDTO;
    revenueOverTime: RevenueOverTimeDTO[];
    topVendors: TopVendorDTO[];
}

export interface IAnalyticsRepository {
    getTotalRevenue(startDate: Date, endDate: Date): Promise<number>;
    getTotalSales(startDate: Date, endDate: Date): Promise<number>;
    getTotalOrders(startDate: Date, endDate: Date): Promise<number>;
    getActiveVendorsCount(startDate: Date, endDate: Date): Promise<number>;
    getActiveBuyersCount(startDate: Date, endDate: Date): Promise<number>;
    getCommissionRevenue(startDate: Date, endDate: Date): Promise<number>;
    getRevenueOverTime(startDate: Date, endDate: Date, interval: string): Promise<Array<{ date: Date; amount: number }>>;
    // getTopVendors(limit: number): Promise<Array<{ vendor: typeof VendorModel; revenue: number }>>;
    getTopVendors(limit: number): Promise<Array<{ vendor: { storeName: string }; revenue: number }>>;
}

@injectable()
export class AnalyticsRepository implements IAnalyticsRepository {
    async getTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
        const result = await PaymentTransactionModel.aggregate([
            {
                $match: {
                    status: 'completed',
                    paymentDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        return result[0]?.total || 0;
    }

    async getTotalSales(startDate: Date, endDate: Date): Promise<number> {
        const result = await OrderModel.aggregate([
            {
                $match: {
                    status: 'delivered',
                    updatedAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);
        return result[0]?.total || 0;
    }

    async getTotalOrders(startDate: Date, endDate: Date): Promise<number> {
        return OrderModel.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });
    }

    async getActiveVendorsCount(startDate: Date, endDate: Date): Promise<number> {
        return VendorModel.countDocuments({
            verified: true,
            blacklisted: false,
            createdAt: { $gte: startDate, $lte: endDate }
        });
    }

    async getActiveBuyersCount(startDate: Date, endDate: Date): Promise<number> {
        // Assuming buyers are users who have placed orders
        const result = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$userId'
                }
            },
            {
                $count: 'total'
            }
        ]);
        return result[0]?.total || 0;
    }

    async getCommissionRevenue(startDate: Date, endDate: Date): Promise<number> {
        // Assuming commission is a percentage of total revenue
        const totalRevenue = await this.getTotalRevenue(startDate, endDate);
        return totalRevenue * 0.1; // 10% commission rate
    }

    async getRevenueOverTime(
        startDate: Date,
        endDate: Date,
        interval: string
    ): Promise<Array<{ date: Date; amount: number }>> {
        let groupBy: any;
        switch (interval) {
            case 'day':
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } };
                break;
            case 'week':
                groupBy = { $dateToString: { format: '%Y-%U', date: '$paymentDate' } };
                break;
            case 'month':
                groupBy = { $dateToString: { format: '%Y-%m', date: '$paymentDate' } };
                break;
            default:
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } };
        }

        const result = await PaymentTransactionModel.aggregate([
            {
                $match: {
                    status: 'completed',
                    paymentDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    total: { $sum: '$amount' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        return result.map((item) => ({
            date: new Date(item._id),
            amount: item.total
        }));
    }

    async getTopVendors(limit: number): Promise<Array<{ vendor: any; revenue: number }>> {
        const result = await OrderModel.aggregate([
            {
                $match: {
                    status: 'delivered'
                }
            },
            {
                $unwind: '$products'
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails'
            },
            {
                $group: {
                    _id: '$productDetails.vendorId',
                    revenue: { $sum: { $multiply: ['$products.priceAtPurchase', '$products.quantity'] } }
                }
            },
            {
                $sort: { revenue: -1 }
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'vendors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'vendor'
                }
            },
            {
                $unwind: '$vendor'
            }
        ]);

        return result.map((item) => ({
            vendor: item.vendor,
            revenue: item.revenue
        }));
    }
}