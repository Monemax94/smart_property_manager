import { Schema, model, Document, Types } from 'mongoose';

export interface INewsletter extends Document {
  email: string;
  userId?: Types.ObjectId;
  organization: Types.ObjectId;
  isActive: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  preferences?: {
    productUpdates: boolean;
    promotions: boolean;
    news: boolean;
    events: boolean;
  };
}

export interface SubscribeToNewsletterData {
  email: string;
  userId?: string;
  organization: string; // Organization ID or slug
  preferences?: {
    productUpdates?: boolean;
    promotions?: boolean;
    news?: boolean;
    events?: boolean;
  };
}

const NewsletterSchema = new Schema<INewsletter>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date,
    default: null
  },
  preferences: {
    productUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    news: { type: Boolean, default: true },
    events: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Compound index for organization + email uniqueness
NewsletterSchema.index({ organization: 1, email: 1 }, { unique: true });
NewsletterSchema.index({ organization: 1, userId: 1 });
NewsletterSchema.index({ organization: 1, isActive: 1 });

export default model<INewsletter>('Newsletter', NewsletterSchema);