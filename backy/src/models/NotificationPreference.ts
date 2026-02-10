import { Schema, model, Document } from 'mongoose';

export interface INotificationPreference extends Document {
  user: Schema.Types.ObjectId;
  email: boolean;
  sms: boolean;
  browser: boolean;
  systemUpdates: boolean;
  transactionUpdates: boolean;
  marketingPromotions: boolean;
  securityAlerts: boolean;
}

const notificationPreferenceSchema = new Schema<INotificationPreference>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  email: { type: Boolean, default: true },
  sms: { type: Boolean, default: false },
  browser: { type: Boolean, default: true },
  systemUpdates: { type: Boolean, default: true },
  transactionUpdates: { type: Boolean, default: true },
  marketingPromotions: { type: Boolean, default: false },
  securityAlerts: { type: Boolean, default: true }
}, { timestamps: true });

export default model<INotificationPreference>(
  'NotificationPreference', 
  notificationPreferenceSchema
);