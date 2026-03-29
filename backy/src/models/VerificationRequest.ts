import mongoose, { Schema, Document, Types } from 'mongoose';
import { FileInfoSchema, FileInfo } from './File';

export interface IVerificationRequest extends Document {
  user: Types.ObjectId;
  roleRequested: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  ninSlip: FileInfo;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationRequestSchema = new Schema<IVerificationRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roleRequested: { type: String, enum: ['admin', 'agent', 'landlord'], required: true, default: 'admin' },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },
    ninSlip: { type: FileInfoSchema, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNotes: { type: String }
  },
  {
    timestamps: true,
  }
);

const VerificationRequestModel = mongoose.model<IVerificationRequest>('VerificationRequest', VerificationRequestSchema);
export default VerificationRequestModel;
