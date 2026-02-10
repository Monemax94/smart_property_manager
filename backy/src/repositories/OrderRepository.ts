import { injectable, inject } from 'inversify';
import { OrderModel, OrderStatus, IOrder, PaymentStatus, DeliveryStatus, ITrackingEvent } from "../models/OrderModel"
import { CartModel, ICart } from "../models/Cart"
import { ProductModel } from "../models/Product"
import { TYPES } from "../config/types"
import { IProduct } from '../models/Product';
import { Model, Types } from 'mongoose';
import { CartRepository } from './CartRepository';
import { ActivityLogService } from '../services/ActivityLogService';
import { ActivityIcon, ActivityType, AlertLevel } from '../models/ActivityLog';
import { HydratedDocument } from 'mongoose';
import { IPaymentTransaction, TransactionStatus } from '../models/Payments';
import { ApiError } from '../utils/ApiError';
import loggers from '../utils/loggers';
import { CategoryService } from '../services/CategoryService';
import { CartService } from '../services/CartService';

export interface OrderProductVariantDTO {
    name: string;
    value: string;
}

export interface VendorOrderResponse {
    order: IOrder;
    payment: IPaymentTransaction | null;
}

interface GetVendorProductsParams {
    vendorId: string | Types.ObjectId;
    page?: number;
    limit?: number;
    statuses?: OrderStatus[];
}


interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface OrderProductDTO {
    productId: string;
    quantity: number;
    priceAtPurchase: number;
    selectedVariants?: OrderProductVariantDTO[];
    notes?: string;
}

export interface CreateOrderDto {
    userId: string;
    products: OrderProductDTO[];
    totalAmount: number;
    orderId?: string;
    date?: Date;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    deliveryStatus?: DeliveryStatus;
    shippingAddressId?: string;
    billingAddressId?: string;
    trackingNumber?: string;
    trackingUrl?: string;
}


@injectable()
export class OrderRepository {
    constructor(
        @inject(TYPES.ProductModel) private productModel: Model<IProduct>,
        @inject(TYPES.CartRepository) private cartRepo: CartRepository,
        @inject(TYPES.CartService) private cartService: CartService,
        @inject(TYPES.ActivityLogService) private activityService: ActivityLogService,
    ) { }

    async create(data: CreateOrderDto) {
        const { products: productItems, ...rest } = data;
        const productIds = productItems.map(item => item.productId);

        // Verify all products exist
        const products = await this.productModel.find({ _id: { $in: productIds } });
        if (products.length !== productIds.length) {
            throw new Error('Some products not found');
        }

        // Calculate total price
        const price = products.reduce((total, product) => {
            const item = productItems.find(i => i.productId === product._id.toString());
            const quantity = item?.quantity || 1;
            return total + (product.discountedPrice || product.price) * quantity;
        }, 0);

        // Format products array to match schema
        const formattedProducts = productItems.map(item => ({
            product: item.productId,
            quantity: item.quantity
        }));

        const created = await OrderModel.create({
            ...rest,
            price,
            products: formattedProducts
        });
        if (created) {
            await this.activityService.logActivity({
                title: 'Order Placed',
                description: `you placed an order with the id: ${created.orderId}`,
                activityType: ActivityType.ORDER_PLACED,
                user: created.userId,
                metadata: {
                    alertLevel: AlertLevel.SUCCESS,
                },
                icon: ActivityIcon.CHECK_CIRCLE
            })
        }
        return created;
    }

    // createOrderFromCartBulk = async (
    //     userId: string,
    //     addressId: string,
    //     vendorId?: string
    // ): Promise<{ orders: IOrder[] }> => {
    //     try {
    //         // a cleared product is those that payment where made for
    //         const cartResponse = await this.cartRepo.getCart(userId);
    //         if (!cartResponse || cartResponse.rawCart.items.length === 0) {
    //             throw ApiError.notFound("Cart is empty");
    //         }

    //         let { vendorGroups } = cartResponse;

    //         // vendor-specific payment
    //         if (vendorId) {
    //             vendorGroups = vendorGroups.filter(g => g.vendorId === vendorId);
    //             if (vendorGroups.length === 0) {
    //                 throw ApiError.notFound(`Vendor ${vendorId} has no items in cart`);
    //             }
    //         }

    //         const orders: IOrder[] = [];

    //         for (const group of vendorGroups) {
    //             const orderProducts = group.items.map(item => ({
    //                 product: item.productId,
    //                 quantity: item.quantity,
    //                 priceAtPurchase: item.verifiedPrice,
    //                 selectedVariants: item.selectedVariants,
    //                 notes: item.notes
    //             }));

    //             const totalAmount = group.items.reduce(
    //                 (sum, item) => sum + item.verifiedPrice * item.quantity,
    //                 0
    //             );

    //             const order = await OrderModel.create({
    //                 userId,
    //                 vendorId: group.vendorId,
    //                 products: orderProducts,
    //                 totalAmount,
    //                 shippingAddress: addressId,
    //                 billingAddress: addressId,
    //                 status: OrderStatus.ORDER_PLACED,
    //                 paymentStatus: PaymentStatus.Paid,
    //                 deliveryStatus: DeliveryStatus.Pending
    //             });

    //             orders.push(order);
    //         }

    //         if (vendorId) {
    //             // only remove this vendor's items
    //             await this.cartRepo.removeVendorItems(userId, vendorId);
    //         } else {
    //             // clear entire cart
    //             await this.cartRepo.clearCart(userId);
    //         }

    //         return { orders };

    //     } catch (error: any) {
    //         console.error("Error creating bulk vendor orders:", error);
    //         throw new Error(`Failed to create vendor orders: ${error.message}`);
    //     }
    // };

    createOrderFromCartBulk = async (
        userId: string,
        addressId: string,
        vendorId?: string
    ): Promise<{ orders: IOrder[] }> => {
        try {
            const cartResponse = await this.cartRepo.getCart(userId);

            if (!cartResponse || cartResponse.rawCart.items.length === 0) {
                throw ApiError.notFound("Cart is empty");
            }

            let { vendorGroups } = cartResponse;

            if (vendorId) {
                vendorGroups = vendorGroups.filter(g => g.vendorId === vendorId);

                if (vendorGroups.length === 0) {
                    throw ApiError.notFound(`Vendor ${vendorId} has no items in cart`);
                }
            }

            const summary = await this.cartService.buildCartSummary(vendorGroups);

            const orders: IOrder[] = [];

            for (const group of vendorGroups) {

                const vendorSummary = await summary.vendors.find(
                    (v: any) => String(v.vendorId) === String(group.vendorId)
                );

                const orderProducts = group.items.map(item => ({
                    product: item.productId,
                    quantity: item.quantity,
                    priceAtPurchase: item.verifiedPrice,
                    selectedVariants: item.selectedVariants,
                    notes: item.notes
                }));

                const totalAmount = group.items.reduce(
                    (sum, item) => sum + item.verifiedPrice * item.quantity,
                    0
                );

                const order = await OrderModel.create({
                    userId,
                    vendorId: group.vendorId,
                    products: orderProducts,
                    totalAmount,
                    shippingAddress: addressId,
                    billingAddress: addressId,
                    status: OrderStatus.PENDING,
                    paymentStatus: PaymentStatus.Paid,
                    deliveryStatus: DeliveryStatus.Pending,
                    summary: {
                        subtotal: vendorSummary?.subtotal || totalAmount,
                        shippingFee: vendorSummary?.shippingFee || 0,
                        serviceFee: summary.serviceFeeRate * (vendorSummary?.subtotal || 0),
                        totalItems: vendorSummary?.itemCount || orderProducts.length,
                        totalQuantity: vendorSummary?.quantityCount || 0,
                        totalWeightKg: summary.totalWeightKG || 0,
                        grandTotal:
                            (vendorSummary?.subtotal || totalAmount) +
                            (vendorSummary?.shippingFee || 0)
                    }
                });

                /**
                 * place order tracking history
                 */
                if (order.paymentStatus === PaymentStatus.Paid) {
                    await order.addOrUpdateTrackingEvent({
                        status: OrderStatus.ORDER_PLACED,
                        description: "Order placed successfully. Payment received.",
                        timestamp: new Date()
                    });
                }

                orders.push(order);
            }

            if (vendorId) {
                await this.cartRepo.removeVendorItems(userId, vendorId);
            } else {
                await this.cartRepo.clearCart(userId);
            }

            return { orders };

        } catch (error: any) {
            loggers.error("Error creating bulk vendor orders:", error);
            throw ApiError.internal(`Failed to create vendor orders: ${error.message}`);
        }
    };

    getVendorSalesSummary = async (vendorId: string) => {
        return await OrderModel.aggregate([
            {
                $match: {
                    vendorId: new Types.ObjectId(vendorId),
                    isDeleted: false,
                    paymentStatus: "Paid"
                }
            },

            // Expand products[]
            { $unwind: "$products" },

            {
                $group: {
                    _id: "$vendorId",

                    // Total quantity sold (summed for all products)
                    totalQuantitySold: { $sum: "$products.quantity" },

                    // Total sales = quantity × priceAtPurchase
                    totalSales: {
                        $sum: {
                            $multiply: [
                                "$products.quantity",
                                "$products.priceAtPurchase"
                            ]
                        }
                    },

                    // Optional: Get breakdown of items sold
                    productBreakdown: {
                        $push: {
                            product: "$products.product",
                            quantity: "$products.quantity",
                            priceAtPurchase: "$products.priceAtPurchase"
                        }
                    }
                }
            },

            {
                $project: {
                    _id: 0,
                    vendorId: "$_id",
                    totalQuantitySold: 1,
                    totalSales: 1,
                    productBreakdown: 1
                }
            }
        ]);
    }

    createOrderFromCart = async (userId: string, addressId: string): Promise<IOrder> => {
        try {
            const { rawCart: cart } = await this.cartRepo.getCart(userId);
            if (!cart || cart.items.length === 0) {
                throw new Error('Cart is empty');
            }

            // Get current prices for all products
            const productIds = cart.items.map(item => item.productId);
            const products = await ProductModel.find({ _id: { $in: productIds } });

            const orderProducts = cart.items.map(item => {
                // Convert both IDs to strings for comparison
                const product = products.find(p => p._id.toString() === item.productId._id.toString());
                if (!product) {
                    throw new Error(`Product ${item.productId} not found in database`);
                }

                return {
                    product: item.productId,
                    quantity: item.quantity,
                    priceAtPurchase: product.price,
                    selectedVariants: item.selectedVariants,
                    notes: item.notes
                };
            });

            const totalAmount = orderProducts.reduce(
                (sum, item) => sum + (item.priceAtPurchase * item.quantity),
                0
            );

            const order = new OrderModel({
                userId,
                products: orderProducts,
                totalAmount,
                shippingAddress: addressId,
                billingAddress: addressId
            });

            await order.save();
            await CartModel.findOneAndUpdate(
                { userId },
                { $set: { items: [] } }
            );

            return order;
        } catch (error) {
            console.error('Error creating order from cart:', error);
            throw new Error(`Failed to create order: ${error.message}`);
        }
    }

    async getOrderStatistics(userId?: string) {
        const baseMatch = {
            isDeleted: false,
            status: { $nin: [OrderStatus.CANCELLED, OrderStatus.RETURNED] }
        };

        const userMatch = userId ? { userId: new Types.ObjectId(userId) } : {};
        const matchStage = { ...baseMatch, ...userMatch };

        const result = await OrderModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: {
                        $sum: {
                            $cond: [
                                {
                                    $in: ["$status", [
                                        OrderStatus.PENDING,
                                        OrderStatus.PAYMENT_SUCCESS
                                    ]]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    completed: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", OrderStatus.DELIVERED] },
                                1,
                                0
                            ]
                        }
                    },
                    shipped: {
                        $sum: {
                            $cond: [
                                {
                                    $in: ["$status", [
                                        OrderStatus.SHIPPED
                                    ]]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    pending: 1,
                    completed: 1,
                    shipped: 1
                }
            }
        ]);

        // Return result or default stats if no orders found
        return result[0] || {
            total: 0,
            pending: 0,
            completed: 0,
            shipped: 0
        };
    }

    async findAll(
        userId?: string,
        page: number = 1,
        limit: number = 10,
        filters: Record<string, any> = {}
    ): Promise<{ data: IOrder[]; total: number }> {
        const query: any = { ...filters };

        if (userId) {
            query.userId = userId;
        }

        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            OrderModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'name email')
                .populate('products.product')
                .populate('shippingAddress')
                .populate('billingAddress')
                .populate({
                    path: 'disputes',
                    match: { isDeleted: false },
                    populate: [
                        { path: 'raisedBy', select: 'name email' },
                        { path: 'responses.responder', select: 'name role' }
                    ]
                })
                .exec(),

            OrderModel.countDocuments(query)
        ]);

        return { data, total };
    }

    async findById(id: string): Promise<HydratedDocument<IOrder> | null> {
        return await OrderModel.findById(id)
            .populate('userId', 'name email')
            .populate({
                path: 'products.product',
                populate: [
                    {
                        path: 'vendorId',
                        model: 'Vendor',
                        select: 'storeName verified performance address logo'
                    },
                    {
                        path: 'reviews',  // populate reviews virtual
                        model: 'ProductReview',
                        populate: {        
                            path: 'userId',
                            model: 'User',
                            select: 'name email'
                        }
                    }
                ]
            })
            .populate('shippingAddress')
            .populate('billingAddress')
            .populate({
                path: 'disputes',
                match: { isDeleted: false },
                populate: [
                    { path: 'raisedBy', select: 'name email' },
                    { path: 'responses.responder', select: 'name role' }
                ]
            })
            .exec();
    }
    
    async update(id: string, data: Partial<CreateOrderDto>) {
        return await OrderModel.findByIdAndUpdate(id, data, { new: true }).populate('products');
    }

    async delete(id: string) {
        return OrderModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).populate('products');
    }

    async counter() {
        return OrderModel.countDocuments();
    }

    getVendorOrders = async ({
        vendorId,
        page = 1,
        limit = 10,
        statuses = [
            OrderStatus.PENDING,
            OrderStatus.PAYMENT_SUCCESS,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.CONFIRMED,
            OrderStatus.DISPUTE,
        ]
    }: GetVendorProductsParams): Promise<PaginatedResult<any>> => {

        const skip = (page - 1) * limit;
        const vendorObjectId = new Types.ObjectId(vendorId.toString());

        // First, find products by this vendor
        const vendorProducts = await ProductModel.find({
            vendorId: vendorObjectId
        });

        const productIds = vendorProducts.map(p => p._id);


        // Then find orders that contain these products with the specified statuses
        const query = {
            status: { $in: statuses },
            isDeleted: false,
            'products.product': { $in: productIds }
        };

        const [orders, total] = await Promise.all([
            OrderModel.find(query)
                .populate('userId', 'email phoneNumber userID')
                .populate('products.product')
                .populate('shippingAddress')
                .populate('billingAddress')
                .populate({
                    path: 'userId',
                    select: '_id email phoneNumber userID',
                    populate: {
                        path: 'profile',
                        model: 'Profile'
                    }
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            OrderModel.countDocuments(query)
        ]);
        console.log(productIds)
        // Filter products to only include vendor's products
        const filteredOrders = orders
            .map(order => ({
                ...order,
                products: order.products.filter(product =>
                    productIds.map(id => id.toString()).includes(product.product._id.toString())
                )
            }))
            .filter(order => order.products.length > 0);


        const pages = Math.ceil(total / limit);

        return {
            data: filteredOrders,
            pagination: {
                page,
                limit,
                total,
                pages,
                hasNext: page < pages,
                hasPrev: page > 1
            }
        };
    }

    async updateStatus(
        orderId: string,
        status: OrderStatus,
        event: ITrackingEvent,
        trackingInfo?: {
            trackingNumber?: string;
            trackingUrl?: string;
            carrier?: string; // client side
        }
    ) {
        const order = await OrderModel.findById(orderId);
        if (!order) return null;

        // Always update status
        order.status = status;

        // Only update tracking *if provided*
        if (trackingInfo) {
            if (trackingInfo.trackingNumber) {
                order.trackingNumber = trackingInfo.trackingNumber;
            }

            if (trackingInfo.trackingUrl) {
                order.trackingUrl = trackingInfo.trackingUrl;
            }

            if (trackingInfo.carrier) {
                order.carrier = trackingInfo.carrier;
            }
        }

        if (event) {
            await order.addOrUpdateTrackingEvent(event);
        }

        return order.save();
    }

    async bulkUpdateOrdersPaymentStatus(
        orderIds: Types.ObjectId[],
        status: TransactionStatus
    ) {

        if (!Array.isArray(orderIds) || orderIds.length === 0) return;

        let orderPaymentStatus: PaymentStatus = PaymentStatus.Unpaid;

        switch (status) {
            case TransactionStatus.Completed:
                orderPaymentStatus = PaymentStatus.Paid;
                break;
            case TransactionStatus.Refunded:
                orderPaymentStatus = PaymentStatus.Refunded;
                break;
            case TransactionStatus.Disputed:
                orderPaymentStatus = PaymentStatus.Disputed;
                break;
            case TransactionStatus.Failed:
                orderPaymentStatus = PaymentStatus.Failed;
                break;
        }

        return await OrderModel.updateMany(
            { _id: { $in: orderIds } },
            { paymentStatus: orderPaymentStatus }
        );
    }

    getTopBuyers = async (limit = 5) => {
        const buyers = await OrderModel.aggregate([
            {
                $match: {
                    paymentStatus: "Paid",
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: "$userId",
                    orders: { $sum: 1 },
                    spent: { $sum: "$totalAmount" }
                }
            },
            { $sort: { spent: -1 } },
            { $limit: limit },

            // Join User
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },

            // Join Profile for avatar
            {
                $lookup: {
                    from: "profiles",
                    localField: "user.profile",
                    foreignField: "_id",
                    as: "profile"
                }
            },
            { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },

            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    name: {
                        $concat: [
                            { $ifNull: ["$profile.firstName", ""] },
                            " ",
                            { $ifNull: ["$profile.lastName", ""] }
                        ]
                    },
                    avatar: "$profile.photo.url",
                    orders: 1,
                    spent: 1
                }
            }
        ]);

        return buyers;
    }
    getTopVendors = async (limit = 5) => {
        const vendors = await OrderModel.aggregate([
            {
                $match: {
                    paymentStatus: "Paid",
                    isDeleted: false
                }
            },

            // Expand ordered products
            { $unwind: "$products" },

            // Look up product to get vendorId
            {
                $lookup: {
                    from: "products",
                    localField: "products.product",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },

            // Group by vendorId
            {
                $group: {
                    _id: "$product.vendorId",
                    productsSold: { $sum: "$products.quantity" }
                }
            },

            { $sort: { productsSold: -1 } },
            { $limit: limit },

            // Join vendor user + profile for avatar + name
            {
                $lookup: {
                    from: "vendors",
                    localField: "_id",
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            { $unwind: "$vendor" },

            {
                $lookup: {
                    from: "users",
                    localField: "vendor.user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },

            {
                $lookup: {
                    from: "profiles",
                    localField: "user.profile",
                    foreignField: "_id",
                    as: "profile"
                }
            },
            { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },

            // Vendor clicks (optional)
            {
                $lookup: {
                    from: "vendorclicks",
                    localField: "_id",
                    foreignField: "vendorId",
                    as: "clickStats"
                }
            },
            {
                $addFields: {
                    clicks: { $sum: "$clickStats.clicks" }
                }
            },

            {
                $project: {
                    _id: 0,
                    vendorId: "$_id",
                    vendorName: "$vendor.storeName",
                    logo: "$vendor.logo.0.url",
                    clicks: { $ifNull: ["$clicks", 0] },
                    productsSold: 1
                }
            }
        ]);

        return vendors;
    }
}
