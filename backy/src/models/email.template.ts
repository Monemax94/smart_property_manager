import { Schema, model, Document } from 'mongoose';

export enum EmailTemplateType {
  WAITLIST_CONFIRMATION = 'waitlist_confirmation',
  LAUNCH_ANNOUNCEMENT = 'launch_announcement',
  NEWSLETTER = 'newsletter',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_VERIFICATION = 'account_verification',

}


export interface IEmailTemplate extends Document {
  organization: Schema.Types.ObjectId;
  templateType: EmailTemplateType;
  subject: string;
  htmlContent: string;
  textContent?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>({
  organization: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  templateType: { 
    type: String, 
    enum: Object.values(EmailTemplateType), 
    required: true 
  },
  subject: { type: String, required: true },
  htmlContent: { type: String, required: true },
  textContent: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Compound index to ensure one active template per type per organization
EmailTemplateSchema.index(
  { organization: 1, templateType: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

export const EmailTemplateModel = model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);