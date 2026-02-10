import { Schema, model, Document, Types } from 'mongoose';
import { generateSequentialId } from '../utils/id.generator';
import { IProduct } from './Product';
import { FileInfo, FileInfoSchema } from './File';
import { PayoutStatus } from './Payouts';

export enum PaymentStatus {
  Paid = 'Paid',
  Escrow_Held = 'Escrow_Held',
  Cancelled = 'Cancelled',
  Unpaid = 'Unpaid',
  Failed = 'failed',
  Disputed = 'Disputed',
  Refunded = 'Refunded',
}

export enum DeliveryStatus {
  Delivered = 'Delivered',
  Shipped = 'Shipped',
  Refunded = 'Refunded',
  Pending = 'Pending',
  Processing = 'Processing'
}

export enum OrderStatus {
  PENDING = 'pending',
  PAYMENT_SUCCESS = 'payment successful',
  ORDER_PLACED = 'order placed',
  ONGOING = 'ongoing',
  SHIPPED = 'shipped (in transit)',
  DELIVERED = 'delivered',
  CONFIRMED = 'received',
  DISPUTE = 'dispute submitted',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refund'
}

export interface IOrderProductVariant {
  name: string;
  value: string;
}

export interface IOrderProduct {
  product: Types.ObjectId | IProduct;
  quantity: number;
  priceAtPurchase: number;
  selectedVariants?: IOrderProductVariant[];
  notes?: string;
}

export interface ITrackingEvent {
  status: OrderStatus;
  description: string;
  location?: string;
  media?: FileInfo[];
  timestamp: Date;
  meta?: Record<string, any>; 
}


export interface IOrder extends Document {
  userId: Types.ObjectId;
  products: IOrderProduct[];
  date: Date;
  isDeleted: boolean;
  totalAmount: number;
  orderId?: string;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  shippingAddress?: Types.ObjectId;
  payoutStatus: PayoutStatus,
  payoutId?: Types.ObjectId,
  vendorId?: Types.ObjectId;
  billingAddress?: Types.ObjectId;
  status: OrderStatus; 
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  logisticName?: string;
  trackingHistory: ITrackingEvent[];
  estimatedDelivery?: Date;
  canUserReview: ()=> void;
  addOrUpdateTrackingEvent: (event: ITrackingEvent) => Promise<IOrder>;
  summary: {
    subtotal: number;
    shippingFee: number;
    serviceFee: number;
    totalItems: number;
    totalQuantity: number;
    grandTotal: number;
  };  
}

const OrderProductVariantSchema = new Schema<IOrderProductVariant>({
  name: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const OrderProductSchema = new Schema<IOrderProduct>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceAtPurchase: { type: Number, required: true },
  selectedVariants: { type: [OrderProductVariantSchema], default: [] },
  notes: { type: String, maxlength: 500 }
}, { _id: false });

const orderSummarySchema = new Schema(
  {
    subtotal: { type: Number, required: true, default: 0 },
    shippingFee: { type: Number, required: true, default: 0 },
    serviceFee: { type: Number, required: true, default: 0 },
    totalItems: { type: Number, required: true, default: 0 },
    totalQuantity: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    totalWeightKg: { type: Number, required: true, default: 0 }
  },
  { _id: false } 
);


const trackingEventSchema = new Schema<ITrackingEvent>({
  status: { 
    type: String, 
    enum: Object.values(OrderStatus),
    required: true 
  },
  description: { type: String, required: true },
  location: { type: String },
  media: { type: [FileInfoSchema], default: [] },
  timestamp: { type: Date, required: true, default: Date.now },
  meta: { 
    type: Schema.Types.Mixed, 
    default: {} 
  }
});

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: { type: [OrderProductSchema], required: true },
    date: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    orderId: { type: String, unique: true },
    totalAmount: { type: Number, required: true },
    vendorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Vendor', 
      required: true,
    },
    payoutStatus: {
      type: String,
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.PENDING
    },
    payoutId: { type: Schema.Types.ObjectId, ref: 'VendorPayout'},
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Unpaid
    },
    deliveryStatus: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.Processing
    },
    shippingAddress: { type: Schema.Types.ObjectId, ref: 'Address' },
    billingAddress: { type: Schema.Types.ObjectId, ref: 'Address' },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING
    },
    trackingNumber: { type: String },
    carrier: { type: String },
    trackingUrl: { type: String },
    trackingHistory: { type: [trackingEventSchema], default: [] },
    estimatedDelivery: { type: Date },
    summary: {
      type: orderSummarySchema,
      default: () => ({})
    },
  },
  { timestamps: true }
);

orderSchema.virtual('disputes', {
  ref: 'Dispute',
  localField: '_id',
  foreignField: 'order',
});

orderSchema.set('toObject', { virtuals: true });
orderSchema.set('toJSON', { virtuals: true });


orderSchema.pre<IOrder>('save', async function (next) {
  if (!this.isNew) return next();
  try {
    this.orderId = await generateSequentialId(OrderModel, 'ORD');
    next();
  } catch (err: any) {
    next(err);
  }
});

orderSchema.methods.addOrUpdateTrackingEvent = async function (event: ITrackingEvent) {
  const existingIndex = this.trackingHistory.findIndex(e => e.status === event.status);

  if (existingIndex >= 0) {
    // Update the existing one
    this.trackingHistory[existingIndex] = { 
      ...this.trackingHistory[existingIndex],
      ...event,
      timestamp: new Date()
    };
  } else {
    // Add a new tracking entry
    this.trackingHistory.push(event);
  }

  await this.save();
  return this;
};

orderSchema.methods.canUserReview = function (): boolean {
  return this.status === OrderStatus.DELIVERED;
};

orderSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'orderId',
});
export const OrderModel = model<IOrder>('Order', orderSchema);