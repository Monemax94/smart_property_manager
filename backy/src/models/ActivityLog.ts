
import mongoose, { Schema, Document } from 'mongoose';



export enum ActivityType {
  // authen
  PASSWORD_RESET = "PASSWORD_RESET",
  PIN_RESET = "PIN_RESET",
  ACCOUNT_RECOVERY = "ACCOUNT_RECOVERY",
  ACCOUNT_RECOVERY_EMAIL_SETUP = "ACCOUNT_RECOVERY_EMAIL_SETUP",
  LOGIN = "LOGIN",
  // Customer-related
  CUSTOMER_REGISTRATION = "CUSTOMER_REGISTRATION",
  ADMIN_REGISTRATION = "ADMIN_REGISTRATION",
  // Vendor-related
  VENDOR_REGISTRATION = "VENDOR_REGISTRATION",
  VENDOR_VERIFICATION_SUBMITTED = "VENDOR_VERIFICATION_SUBMITTED",
  VENDOR_VERIFICATION_APPROVED = "VENDOR_VERIFICATION_APPROVED",
  VENDOR_VERIFICATION_REJECTED = "VENDOR_VERIFICATION_REJECTED",

  // Transaction-related
  PAYMENT_PROCESSED = "PAYMENT_PROCESSED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  WITHDRAWAL_REQUESTED = "WITHDRAWAL_REQUESTED",

  // Dispute-related
  DISPUTE_OPENED = "DISPUTE_OPENED",
  DISPUTE_RESOLVED = "DISPUTE_RESOLVED",

  // order-related
  ORDER_PLACED = "ORDER_PLACED",
  ORDER_DISPATCH = "ORDER_DISPATCH",
  ORDER_DELIVERED = "ORDER_DELIVERED",

  // System alerts
  SYSTEM_ALERT = "SYSTEM_ALERT",

  // Product-related
  PRODUCT_LISTED = "PRODUCT_LISTED",
  PRODUCT_UPDATED = "PRODUCT_UPDATED",
  PRODUCT_CREATED = "PRODUCT_CREATED"
}

export enum AlertLevel {
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL"
}

export enum ActivityStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  NEEDS_ACTION = "NEEDS_ACTION"
}

export enum ActivityIcon {
  USER_PLUS = "user-plus",
  DOLLAR_SIGN = "dollar-sign",
  ALERT_TRIANGLE = "alert-triangle",
  FILE_TEXT = "file-text",
  CHECK_CIRCLE = "check-circle"
}


export interface IActivityLog extends Document {
  user?: mongoose.Types.ObjectId;
  vendor?: mongoose.Types.ObjectId;
  activityType: ActivityType;
  title: string;
  description: string;
  metadata?: {
    amount?: number;
    currency?: string;
    disputeId?: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    alertLevel?: AlertLevel;
  };
  status: ActivityStatus;
  icon: ActivityIcon;
  isAdminOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: false },
    activityType: {
      type: String,
      enum: Object.values(ActivityType),
      required: true
    },

    title: { type: String, required: true },
    description: { type: String, required: true },
    metadata: {
      amount: Number,
      currency: String,
      disputeId: Schema.Types.ObjectId,
      productId: Schema.Types.ObjectId,
      alertLevel: {
        type: String,
        enum: Object.values(AlertLevel)
      }
    },
    status: {
      type: String,
      enum: Object.values(ActivityStatus),
      default: ActivityStatus.COMPLETED
    },
    icon: {
      type: String,
      enum: Object.values(ActivityIcon),
      default: ActivityIcon.FILE_TEXT
    },

    isAdminOnly: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }
  }
);

// Indexes
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ vendor: 1, activityType: 1 });


export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);