import { Schema, model, Document, Types } from 'mongoose';

export interface IApplicationPreference extends Document {
  user: Types.ObjectId;
  darkMode?: boolean;
  defaultCurrency?: string;
  defaultLanguage?: string;
  defaultTimezone?: string;
  dateFormat?: string;

  // Notifications
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  announcements?: boolean;

  // Security
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'EMAIL' | 'AUTH_APP';
  biometricLoginEnabled?: boolean;


  createdAt?: Date;
  updatedAt?: Date;
}

const applicationPreferenceSchema = new Schema<IApplicationPreference>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  darkMode: { type: Boolean, default: false },
  defaultCurrency: { type: String, default: 'USD' },
  defaultLanguage: { type: String, default: 'English' },
  defaultTimezone: { type: String, default: 'UTC (Coordinated Universal Time)' },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },

  // Notifications
  pushNotifications: { type: Boolean, default: false },
  emailNotifications: { type: Boolean, default: false },
  announcements: { type: Boolean, default: false },

  // Security
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorMethod: {
    type: String,
    enum: ['EMAIL', 'AUTH_APP'],
  },
  biometricLoginEnabled: { type: Boolean, default: false },
}, { timestamps: true });

export default model<IApplicationPreference>(
  'ApplicationPreference',
  applicationPreferenceSchema
);