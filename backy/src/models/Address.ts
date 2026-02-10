import { Schema, model, Document, Types } from 'mongoose';

export enum AddressType {
  NORMAL = 'normal',
  BILLING = 'billing',
  SHIPPING = 'shipping',
  PROPERTY = 'property' // Added for property addresses
}

export interface IAddress extends Document {
  userId?: Types.ObjectId;
  propertyId?: Types.ObjectId; // Reference to property
  type: AddressType;
  street?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
  additionalInfo?: string;
  phoneNumber?: string;
  additionalPhoneNumber?: string;
  
  // Additional property address fields
  landmark?: string;
  neighborhood?: string;
  zipCode?: string;
  
  // Geo-coordinates
  latitude?: number;
  longitude?: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export const AddressSchema = new Schema<IAddress>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property'
  },
  type: {
    type: String,
    enum: Object.values(AddressType),
    default: AddressType.NORMAL,
    index: true
  },
  street: { type: String },
  city: { type: String, required: true, index: true },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  state: { type: String, index: true },
  postalCode: { type: String },
  country: { type: String, default: 'Nigeria', index: true },
  isDefault: { type: Boolean, default: false },
  additionalInfo: { type: String, maxlength: 500 },
  phoneNumber: { type: String },
  additionalPhoneNumber: { type: String },
  
  // Additional fields
  landmark: { type: String },
  neighborhood: { type: String, index: true },
  zipCode: { type: String },
  
  // Geo-coordinates
  latitude: { type: Number, min: -90, max: 90 },
  longitude: { type: Number, min: -180, max: 180 }
}, { timestamps: true });

// Compound indexes for faster queries
AddressSchema.index({ userId: 1, isDefault: 1 });
AddressSchema.index({ userId: 1, type: 1 });
AddressSchema.index({ propertyId: 1 });
AddressSchema.index({ city: 1, state: 1, country: 1 });
AddressSchema.index({ latitude: 1, longitude: 1 });

// Ensure only one default address per type per user
AddressSchema.pre('save', async function(next) {
  if (this.isDefault && this.userId) {
    await this.model('Address').updateMany(
      { 
        userId: this.userId, 
        type: this.type, 
        _id: { $ne: this._id } 
      },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Validation: Either userId or propertyId must be present
AddressSchema.pre('validate', function(next) {
  if (!this.userId && !this.propertyId) {
    next(new Error('Either userId or propertyId must be provided'));
  } else {
    next();
  }
});

export const AddressModel = model<IAddress>('Address', AddressSchema);