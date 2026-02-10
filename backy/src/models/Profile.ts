import { Schema, model, Types, Document } from 'mongoose';
import { FileInfo, FileInfoSchema } from './File';

export interface IProfile extends Document {
  alternateEmail?: string;
  firstName: string;
  lastName: string;
  photo?: FileInfo[];
  user: Types.ObjectId;
  address?: string;
  timeZone?: string;
  jobTitle?: string;
  dob?: Date;
  bio?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfileDocument extends IProfile, Document {}


const ProfileSchema = new Schema<IProfile>(
  {
    alternateEmail: { type: String, },
    firstName: { type: String },
    lastName: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    photo: { type: [FileInfoSchema], default: [] },
    address: String,
    timeZone: String,
    jobTitle: String,
    dob: Date,
    bio: String,
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model<IProfile>('Profile', ProfileSchema);
