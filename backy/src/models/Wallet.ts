import { Schema, model, Document, Types } from 'mongoose';

export enum WalletTransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  PAYMENT = 'payment',
  REFUND = 'refund'
}

export enum WalletTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface IWalletTransaction {
  transactionId: string;
  type: WalletTransactionType;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  status: WalletTransactionStatus;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWallet extends Document {
  userId: Types.ObjectId;
  balance: number;
  currency: string;
  isActive: boolean;
  transactions: IWalletTransaction[];
  stripeCustomerId?: string;
  paymentMethods: {
    cardId: string;
    last4: string;
    brand: string;
    isDefault: boolean;
  }[];
  totalDeposited: number;
  totalWithdrawn: number;
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    transactionId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: Object.values(WalletTransactionType),
      required: true,
      index: true
    },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'USD', required: true },
    description: { type: String, maxlength: 500 },
    reference: { type: String, sparse: true, index: true },
    status: {
      type: String,
      enum: Object.values(WalletTransactionStatus),
      default: WalletTransactionStatus.PENDING,
      index: true
    },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, _id: true }
);

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    transactions: {
      type: [walletTransactionSchema],
      default: []
    },
    stripeCustomerId: {
      type: String,
      sparse: true,
      index: true
    },
    paymentMethods: [
      {
        cardId: { type: String, required: true },
        last4: { type: String, required: true },
        brand: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
      }
    ],
    totalDeposited: {
      type: Number,
      default: 0,
      min: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// Indexes
walletSchema.index({ userId: 1, isActive: 1 });
walletSchema.index({ createdAt: -1 });
walletSchema.index(
  { "transactions.transactionId": 1 },
  { unique: true, sparse: true }
);

export const WalletModel = model<IWallet>('Wallet', walletSchema);