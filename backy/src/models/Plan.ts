import { Schema, model, Document } from 'mongoose';

export enum SubscriptionPlan {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export interface IPlan extends Document {
  name: string;
  price: number;
  plan: SubscriptionPlan;
  durationInDays: number;
  description?: string;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    durationInDays: { type: Number, required: true },
    plan: { type: String, enum: Object.values(SubscriptionPlan) },
    description: { type: String },
  },
  { timestamps: true }
);

export const PlanModel = model<IPlan>('Plan', PlanSchema);
