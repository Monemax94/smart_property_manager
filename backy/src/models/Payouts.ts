import { Schema, model, Document, Types } from 'mongoose';

export enum PayoutStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  IN_TRANSIT = 'in_transit',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export interface IVendorPayout extends Document {
  _id: Types.ObjectId;
  vendorId: Types.ObjectId;
  stripeConnectAccountId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  stripePayoutId?: string;
  orders: Types.ObjectId[];
  transactionIds: string[];
  arrivalDate?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const vendorPayoutSchema = new Schema<IVendorPayout>(
  {
    vendorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    stripeConnectAccountId: { 
      type: String, 
      required: true,
      index: true 
    },
    amount: { 
      type: Number, 
      required: true, 
      min: 0.01 
    },
    currency: { 
      type: String, 
      default: 'USD',
      required: true 
    },
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.PENDING,
      index: true
    },
    stripePayoutId: { 
      type: String, 
      sparse: true,
      index: true 
    },
    orders: [{
      type: Schema.Types.ObjectId,
      ref: 'Order'
    }],
    transactionIds: [{ type: String }],
    arrivalDate: { type: Date },
    failureReason: { type: String, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Indexes for queries
vendorPayoutSchema.index({ vendorId: 1, status: 1 });
vendorPayoutSchema.index({ createdAt: -1 });
// vendorPayoutSchema.index({ stripePayoutId: 1 });

export const VendorPayoutModel = model<IVendorPayout>('VendorPayout', vendorPayoutSchema);
