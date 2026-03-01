import { Schema, model, Document, Types } from 'mongoose';



export enum TransactionStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Refunded = 'refunded',
  PartiallyRefunded = 'partially_refunded',
  Disputed = 'disputed',
  Canceled = 'canceled',
}

export enum TransactionType {
  Order = 'order',
  Payout = 'payout',
  WalletFunding = 'wallet_funding',
  FeaturePayment = 'feature_payment',
  Refund = 'refund'
}
export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  PAYSTACK = 'paystack',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  WALLET = 'wallet'
}


export enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
  CHF = 'CHF',
  CNY = 'CNY',
  INR = 'INR',
  BRL = 'BRL',
  ZAR = 'ZAR',
  NGN = 'NGN',
  GHS = 'GHS',
  KES = 'KES',
  UGX = 'UGX',
}

export interface IPaymentTransaction extends Document {
  // order: Types.ObjectId;
  property: Types.ObjectId; 
  user: Types.ObjectId;
  amount: number;
  currency: CurrencyCode;
  transactionId: string;
  status: TransactionStatus;
  provider?: PaymentProvider;
  transactionType: TransactionType;
  gatewayResponse?: any;
  paymentDate?: Date;
  refundedAmount?: number;
  refundReason?: string;
  metadata?: Record<string, any>;
  transactID?: string;
}



const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    // order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: {
      type: String,
      enum: Object.values(CurrencyCode),
      default: CurrencyCode.USD,
      required: true
    },
  
    transactionType: {
      type: String,
      enum: Object.values(TransactionType),
      required: true
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.Pending,
      required: true
    },
    provider: {
      type: String,
      enum: Object.values(PaymentProvider),
      default: PaymentProvider.PAYSTACK,
      required: true
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    refundedAmount: {
      type: Number,
      min: 0,
      validate: {
        validator: function (this: IPaymentTransaction, value: number) {
          return value <= this.amount;
        },
        message: 'Refunded amount cannot exceed original amount'
      }
    },
    refundReason: {
      type: String,
      maxlength: 500
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    transactID: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.gatewayResponse;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// Virtual for formatted amount
PaymentTransactionSchema.virtual('formattedAmount').get(function (this: IPaymentTransaction) {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Indexes for frequent queries
PaymentTransactionSchema.index({ paymentDate: -1 });
PaymentTransactionSchema.index({ status: 1, paymentDate: -1 });

// Validate refund amount
PaymentTransactionSchema.pre<IPaymentTransaction>('save', function (next) {
  if (this.refundedAmount && this.refundedAmount > this.amount) {
    return next(new Error('Refunded amount exceeds original payment amount'));
  }
  next();
});

// Generate unique transactID if not already set
PaymentTransactionSchema.pre<IPaymentTransaction>('save', async function (next) {
  if (this.isNew && !this.transactID) {
    while (true) {
      const digits = Math.floor(100000000 + Math.random() * 900000000).toString();
      const letters = String.fromCharCode(
        65 + Math.floor(Math.random() * 26),
        65 + Math.floor(Math.random() * 26)
      );
      const candidate = `TXP${digits}${letters}`;

      const exists = await PaymentTransactionModel.exists({ transactID: candidate });
      if (!exists) {
        this.transactID = candidate;
        break;
      }
    }
  }

  next();
});

export const PaymentTransactionModel = model<IPaymentTransaction>(
  'PaymentTransaction',
  PaymentTransactionSchema
);
