import { Schema, model, Document, Types } from 'mongoose';

export interface FileInfo {
  url: string;
  fileSize: number;
  fileType: string;
  format: string;
  publicId: string;
  imageName?: string;
  documentName?: string
}

export const FileInfoSchema = new Schema<FileInfo>(
  {
    url: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true },
    format: { type: String, required: true },
    publicId: { type: String, required: true },
    imageName: { type: String }, // optional
    documentName: {
      type: String,
      enum: ['businessRegistration', 'vendorNIN', 'storeLogo']
    }
  },
  { _id: false }
);