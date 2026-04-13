import { Schema, model, Document, Types } from 'mongoose';

export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  PAYMENT_PENDING = 'payment_pending',
  AGREEMENT_SENT = 'agreement_sent',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export interface IApplication extends Document {
  propertyId: Types.ObjectId;
  tenantId: Types.ObjectId;
  agentId: Types.ObjectId;
  status: ApplicationStatus;
  
  personalInfo: {
    fullName: string;
    phone: string;
    dateOfBirth: Date;
    currentAddress: string;
  };
  employmentInfo: {
    employerName: string;
    jobTitle: string;
    monthlyIncome: number;
    employmentLength: string;
  };
  references: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
  
  meetingDate?: Date;
  meetingStatus?: 'pending' | 'confirmed' | 'rejected';
  proposedBy?: 'tenant' | 'agent';
  
  paymentId?: Types.ObjectId;
  paymentStatus?: 'pending' | 'completed';
  
  agreementDocumentUrl?: string;
  digitalSignature?: string;
  signedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: Object.values(ApplicationStatus), default: ApplicationStatus.PENDING },
  
  personalInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    currentAddress: { type: String, required: true },
  },
  employmentInfo: {
    employerName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    monthlyIncome: { type: Number, required: true },
    employmentLength: { type: String, required: true },
  },
  references: [{
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { type: String, required: true },
  }],
  
  meetingDate: { type: Date },
  meetingStatus: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  proposedBy: { type: String, enum: ['tenant', 'agent'] },
  
  paymentId: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction' },
  paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  
  agreementDocumentUrl: { type: String },
  digitalSignature: { type: String },
  signedAt: { type: Date },
}, { timestamps: true });

export const ApplicationModel = model<IApplication>('Application', ApplicationSchema);
