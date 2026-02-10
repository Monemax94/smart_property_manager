import { Schema, model, Document, Types } from 'mongoose';
import { FileInfoSchema, FileInfo } from './File';

export enum CategoryStatus {
  PENDING = "Pending",
  REJECTED = "Rejected",
  APPROVED = "Approved", 
}

export enum CategoryRequestAction {
  APPROVE = "approve",
  REJECT = "reject"
}

export interface ICategory extends Document {
  name: string;
  description?: string;
  status?: CategoryStatus;
  images: FileInfo[];
  requestedBy?: Types.ObjectId; 
  rejectionReason?: string;
  approvedBy?: Types.ObjectId;
  rejectedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    images: { type: [FileInfoSchema], default: [] },
    description: { type: String },
    requestedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'Vendor',
      required: false 
    },
    status: {
      type: String,
      enum: Object.values(CategoryStatus),
      default: CategoryStatus.PENDING
    },
    rejectionReason: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Indexes for optimized queries
categorySchema.index({ status: 1 });
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ requestedBy: 1 });

export default model<ICategory>('Category', categorySchema);