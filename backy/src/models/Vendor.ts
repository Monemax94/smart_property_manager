import mongoose, { Schema, Types, Document, Model } from 'mongoose';
import { FileInfo, FileInfoSchema } from './File';
import { AddressSchema, IAddress } from './Address';
import { IUserDocument } from "./User"
import { ReviewModel } from './Review';
import { ICategory } from './Category';


export interface IVendorFlag {
  userId: Types.ObjectId | IUserDocument;
  reason?: string;
  media?: FileInfo[];
  createdAt?: Date;
}

export enum CountryCode {
  NG = 'NG', // Nigeria
  US = 'US', // United States
  GB = 'GB', // United Kingdom
  CA = 'CA', // Canada
  EU = 'EU', // European Union
}


// Vendor Interface
export interface IVendor extends Document<Types.ObjectId> {
  user: Types.ObjectId | IUserDocument
  storeName: string;
  storeDescription?: string;
  logo?: typeof FileInfoSchema[];
  businessRegistrationFiles?: typeof FileInfoSchema[];
  vendorNINFiles?: typeof FileInfoSchema[];
  taxId: string;
  address: IAddress;
  website?: string;
  verified?: boolean;
  flags?: IVendorFlag[];
  flagged?: boolean;
  blacklisted?: boolean;
  active?: boolean;
  blacklistedBy?: Types.ObjectId;
  verificationRevoked?: boolean;
  revokedBy?: Types.ObjectId;
  blacklistReason?: string;
  revocationReason?: string;
  categories?: Types.ObjectId[] | ICategory[];
  followers?: Types.ObjectId[];
  stripeConnectAccountId?: string;
  /** Stripe country (ISO-2) */
  // countryCode: CountryCode;
  countryCode: Types.ObjectId;
  performance: number;
  createdAt: Date;
  updatedAt: Date;
}


export interface IVendorModel extends Model<IVendor> {
  getVendorWithReviewStats(vendorId: string): Promise<any>;
}


// Vendor Schema
const VendorSchema = new Schema<IVendor>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true },
    storeDescription: { type: String },
    logo: { type: [FileInfoSchema], default: [] },
    businessRegistrationFiles: { type: [FileInfoSchema], default: [] },
    vendorNINFiles: { type: [FileInfoSchema], default: [] },
    taxId: { type: String, required: true, unique: true },
    stripeConnectAccountId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // allow null/undefined
          return /^acct_[a-zA-Z0-9]+$/.test(v);
        },
        message: 'Invalid Stripe Connect Account ID format',
      },
    },
    address: { type: AddressSchema, required: true },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    website: { type: String },
    flags: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, default: '' },
        media: { type: [FileInfoSchema], default: [] },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    flagged: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', default: [] }],
    //  blacklisting and verification revocation
    blacklisted: {
      type: Boolean,
      default: false,
      index: true
    },
    verificationRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    blacklistReason: {
      type: String,
      default: ''
    },
    revocationReason: {
      type: String,
      default: ''
    },
    blacklistedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    // countryCode: {
    //   type: String,
    //   enum: {
    //     values: Object.values(CountryCode),
    //     message: 'Invalid country code',
    //   },
    //   default: CountryCode.NG,
    //   index: true,
    // },
    countryCode: {
      type: Schema.Types.ObjectId,
      ref: 'CurrencyCode', // Reference to CurrencyCode schema
      required: true,
      index: true,
    },
    performance: {
      type: Number,
      default: 0.0,
      min: 0.0,
      max: 5.0,
      set: (val: number) => parseFloat(val.toFixed(2)) // Store as float with 2 decimal places
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

// Static method to get vendor by ID with review stats
VendorSchema.statics.getVendorWithReviewStats = async function (vendorId: string) {
  const vendor = await this.findById(vendorId)
    .populate({
      path: 'user',
      select: '-password -loginHistory -currentSessions -activityLog -deactivatedBy -isDeleted -__v',
      populate: { path: 'profile', model: 'Profile' },
    })
    .populate({ path: 'address', model: 'Address' })
    .populate({
      path: 'categories',
      model: 'Category',
      select: 'name description status images createdAt updatedAt',
      match: { _id: { $exists: true } }
    })
    .populate({
      path: 'countryCode',
      model: 'CurrencyCode',
      select: 'countryCode country'
    });

  if (!vendor) return null;

  const [stats] = await ReviewModel.aggregate([
    {
      $match: {
        vendorId: new mongoose.Types.ObjectId(vendorId)
      }
    },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalReviews: { $sum: 1 },
              averageRating: { $avg: '$vendorRating' }
            }
          }
        ],
        breakdown: [
          {
            $group: {
              _id: '$vendorRating',
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ]);

  const summary = stats?.summary?.[0] ?? {
    totalReviews: 0,
    averageRating: 0
  };

  // Default breakdown (ensures all ratings exist)
  const ratingsBreakdown: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  };

  stats?.breakdown?.forEach((item: any) => {
    ratingsBreakdown[item._id] = item.count;
  });

  return {
    ...vendor.toObject(),
    totalReviews: summary.totalReviews,
    averageRating: Number(Math.min(summary.averageRating || 0, 5).toFixed(1)),
    ratingsBreakdown
  };
};

const VendorModel = mongoose.model<IVendor, IVendorModel>('Vendor', VendorSchema);
export default VendorModel;