import { Schema, model, Document, Types } from 'mongoose';
import { FileInfo, FileInfoSchema } from './File';

// Enums for property attributes
export enum PropertyType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  LAND = 'land',
  MIXED_USE = 'mixed_use'
}

export enum PropertySubType {
  // Residential
  APARTMENT = 'apartment',
  HOUSE = 'house',
  VILLA = 'villa',
  TOWNHOUSE = 'townhouse',
  PENTHOUSE = 'penthouse',
  STUDIO = 'studio',
  DUPLEX = 'duplex',
  CONDO = 'condo',
  
  // Commercial
  OFFICE = 'office',
  RETAIL = 'retail',
  RESTAURANT = 'restaurant',
  HOTEL = 'hotel',
  SHOPPING_CENTER = 'shopping_center',
  WAREHOUSE = 'warehouse',
  
  // Industrial
  FACTORY = 'factory',
  STORAGE = 'storage',
  DISTRIBUTION_CENTER = 'distribution_center',
  
  // Land
  RESIDENTIAL_PLOT = 'residential_plot',
  COMMERCIAL_PLOT = 'commercial_plot',
  AGRICULTURAL = 'agricultural',
  INDUSTRIAL_PLOT = 'industrial_plot'
}

export enum PropertyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PENDING = 'pending',
  SOLD = 'sold',
  RENTED = 'rented',
  RESERVED = 'reserved',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  UNDER_OFFER = 'under_offer'
}

export enum ListingType {
  FOR_SALE = 'for_sale',
  FOR_RENT = 'for_rent',
  FOR_LEASE = 'for_lease',
  BOTH = 'both' // Both sale and rent
}

export enum FurnishingStatus {
  FURNISHED = 'furnished',
  SEMI_FURNISHED = 'semi_furnished',
  UNFURNISHED = 'unfurnished'
}

export enum ParkingType {
  COVERED = 'covered',
  OPEN = 'open',
  UNDERGROUND = 'underground',
  STREET = 'street',
  NONE = 'none'
}

export enum HeatingType {
  CENTRAL = 'central',
  ELECTRIC = 'electric',
  GAS = 'gas',
  OIL = 'oil',
  SOLAR = 'solar',
  NONE = 'none'
}

export enum CoolingType {
  CENTRAL_AC = 'central_ac',
  SPLIT_AC = 'split_ac',
  WINDOW_AC = 'window_ac',
  EVAPORATIVE = 'evaporative',
  NONE = 'none'
}

export enum PropertyCondition {
  NEW = 'new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  NEEDS_RENOVATION = 'needs_renovation'
}

export enum OwnershipType {
  FREEHOLD = 'freehold',
  LEASEHOLD = 'leasehold',
  COOPERATIVE = 'cooperative',
  SHARED = 'shared'
}

// Property Features & Amenities
export interface PropertyFeatures {
  // Interior
  bedrooms?: number;
  bathrooms?: number;
  halfBathrooms?: number;
  livingRooms?: number;
  kitchens?: number;
  floors?: number;
  floorNumber?: number; // For apartments
  totalFloors?: number; // In building
  
  // Dimensions
  builtUpArea?: number; // Square meters/feet
  carpetArea?: number;
  plotArea?: number;
  balconyArea?: number;
  
  // Features
  hasBalcony?: boolean;
  balconyCount?: number;
  hasTerrace?: boolean;
  hasGarden?: boolean;
  hasPool?: boolean;
  hasGym?: boolean;
  hasElevator?: boolean;
  hasPowerBackup?: boolean;
  hasGatedSecurity?: boolean;
  hasIntercom?: boolean;
  hasCCTV?: boolean;
  hasFireSafety?: boolean;
  
  // Utilities
  hasWaterSupply?: boolean;
  hasGasConnection?: boolean;
  hasElectricity?: boolean;
  hasInternet?: boolean;
  hasSewerConnection?: boolean;
  
  // Additional rooms
  hasStudyRoom?: boolean;
  hasServantQuarters?: boolean;
  hasStoreRoom?: boolean;
  hasPooja?: boolean; // Prayer room
  
  furnishingStatus?: FurnishingStatus;
  parkingType?: ParkingType;
  parkingSpots?: number;
  heatingType?: HeatingType;
  coolingType?: CoolingType;
}

export const PropertyFeaturesSchema = new Schema<PropertyFeatures>({
  bedrooms: { type: Number, min: 0 },
  bathrooms: { type: Number, min: 0 },
  halfBathrooms: { type: Number, min: 0, default: 0 },
  livingRooms: { type: Number, min: 0, default: 1 },
  kitchens: { type: Number, min: 0, default: 1 },
  floors: { type: Number, min: 0 },
  floorNumber: { type: Number, min: 0 },
  totalFloors: { type: Number, min: 0 },
  
  builtUpArea: { type: Number, min: 0 },
  carpetArea: { type: Number, min: 0 },
  plotArea: { type: Number, min: 0 },
  balconyArea: { type: Number, min: 0 },
  
  hasBalcony: { type: Boolean, default: false },
  balconyCount: { type: Number, min: 0, default: 0 },
  hasTerrace: { type: Boolean, default: false },
  hasGarden: { type: Boolean, default: false },
  hasPool: { type: Boolean, default: false },
  hasGym: { type: Boolean, default: false },
  hasElevator: { type: Boolean, default: false },
  hasPowerBackup: { type: Boolean, default: false },
  hasGatedSecurity: { type: Boolean, default: false },
  hasIntercom: { type: Boolean, default: false },
  hasCCTV: { type: Boolean, default: false },
  hasFireSafety: { type: Boolean, default: false },
  
  hasWaterSupply: { type: Boolean, default: true },
  hasGasConnection: { type: Boolean, default: false },
  hasElectricity: { type: Boolean, default: true },
  hasInternet: { type: Boolean, default: false },
  hasSewerConnection: { type: Boolean, default: true },
  
  hasStudyRoom: { type: Boolean, default: false },
  hasServantQuarters: { type: Boolean, default: false },
  hasStoreRoom: { type: Boolean, default: false },
  hasPooja: { type: Boolean, default: false },
  
  furnishingStatus: { 
    type: String, 
    enum: Object.values(FurnishingStatus),
    default: FurnishingStatus.UNFURNISHED
  },
  parkingType: { 
    type: String, 
    enum: Object.values(ParkingType),
    default: ParkingType.NONE
  },
  parkingSpots: { type: Number, min: 0, default: 0 },
  heatingType: { 
    type: String, 
    enum: Object.values(HeatingType),
    default: HeatingType.NONE
  },
  coolingType: { 
    type: String, 
    enum: Object.values(CoolingType),
    default: CoolingType.NONE
  }
}, { _id: false });

// Pricing Information
export interface PricingInfo {
  salePrice?: number;
  rentPrice?: number; // Monthly
  leasePrice?: number; // Annual
  currency?: string;
  pricePerSqFt?: number;
  securityDeposit?: number;
  maintenanceCharges?: number;
  maintenanceChargesPeriod?: 'monthly' | 'quarterly' | 'annually';
  taxAmount?: number;
  taxIncluded?: boolean;
  negotiable?: boolean;
  minRentPeriod?: number; // Months
  priceHistory?: Array<{
    price: number;
    date: Date;
    type: 'sale' | 'rent' | 'lease';
  }>;
}

export const PricingInfoSchema = new Schema<PricingInfo>({
  salePrice: { type: Number, min: 0 },
  rentPrice: { type: Number, min: 0 },
  leasePrice: { type: Number, min: 0 },
  currency: { type: String, default: 'USD' },
  pricePerSqFt: { type: Number, min: 0 },
  securityDeposit: { type: Number, min: 0 },
  maintenanceCharges: { type: Number, min: 0 },
  maintenanceChargesPeriod: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'annually'],
    default: 'monthly'
  },
  taxAmount: { type: Number, min: 0 },
  taxIncluded: { type: Boolean, default: false },
  negotiable: { type: Boolean, default: false },
  minRentPeriod: { type: Number, min: 1 },
  priceHistory: [{
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['sale', 'rent', 'lease'], required: true }
  }]
}, { _id: false });

// Property Documents
export interface PropertyDocuments {
  titleDeed?: FileInfo;
  surveyPlan?: FileInfo;
  approvedBuildingPlan?: FileInfo;
  occupancyCertificate?: FileInfo;
  taxReceipts?: FileInfo[];
  noc?: FileInfo; // No Objection Certificate
  encumbranceCertificate?: FileInfo;
  other?: FileInfo[];
}

export const PropertyDocumentsSchema = new Schema<PropertyDocuments>({
  titleDeed: FileInfoSchema,
  surveyPlan: FileInfoSchema,
  approvedBuildingPlan: FileInfoSchema,
  occupancyCertificate: FileInfoSchema,
  taxReceipts: [FileInfoSchema],
  noc: FileInfoSchema,
  encumbranceCertificate: FileInfoSchema,
  other: [FileInfoSchema]
}, { _id: false });

// Nearby Facilities
export interface NearbyFacilities {
  schools?: Array<{ name: string; distance: number }>; // Distance in km
  hospitals?: Array<{ name: string; distance: number }>;
  shoppingCenters?: Array<{ name: string; distance: number }>;
  publicTransport?: Array<{ name: string; distance: number }>;
  airports?: Array<{ name: string; distance: number }>;
  parks?: Array<{ name: string; distance: number }>;
  restaurants?: Array<{ name: string; distance: number }>;
}

export const NearbyFacilitiesSchema = new Schema<NearbyFacilities>({
  schools: [{ 
    name: { type: String, required: true }, 
    distance: { type: Number, required: true, min: 0 } 
  }],
  hospitals: [{ 
    name: { type: String, required: true }, 
    distance: { type: Number, required: true, min: 0 } 
  }],
  shoppingCenters: [{ 
    name: { type: String, required: true }, 
    distance: { type: Number, required: true, min: 0 } 
  }],
  publicTransport: [{ 
    name: { type: String, required: true }, 
    distance: { type: Number, required: true, min: 0 } 
  }],
  airports: [{ 
    name: { type: String, required: true }, 
    distance: { type: Number, required: true, min: 0 } 
  }],
  parks: [{ 
    name: { type: String, required: true }, 
    distance: { type: Number, required: true, min: 0 } 
  }],
  restaurants: [{ 
    name: { type: String, required: true }, 
    distance: { type: Number, required: true, min: 0 } 
  }]
}, { _id: false });

// Main Property Interface
export interface IProperty extends Document {
  // Basic Information
  title: string;
  description: string;
  propertyType: PropertyType;
  propertySubType: PropertySubType;
  status: PropertyStatus;
  listingType: ListingType;
  
  // Owner/Agent Information
  ownerId: Types.ObjectId;
  agentId?: Types.ObjectId;
  isDeveloperProperty?: boolean;
  developerId?: Types.ObjectId;
  
  // Location - References Address model
  addressId: Types.ObjectId;
  
  // Geo-location for map features
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  
  // Property Details
  features: PropertyFeatures;
  pricing: PricingInfo;
  
  // Media
  images: FileInfo[];
  videos?: FileInfo[];
  virtualTour?: string; // URL to 360 tour
  floorPlans?: FileInfo[];
  
  // Documents
  documents?: PropertyDocuments;
  
  // Additional Information
  yearBuilt?: number;
  lastRenovated?: number;
  propertyCondition?: PropertyCondition;
  ownershipType?: OwnershipType;
  occupancyStatus?: 'vacant' | 'occupied' | 'under_construction';
  possessionDate?: Date;
  
  // Legal & Compliance
  rera?: string; // Real Estate Regulatory Authority number
  propertyTaxId?: string;
  utilityAccounts?: {
    electricity?: string;
    water?: string;
    gas?: string;
  };
  
  // Amenities & Nearby
  amenities?: string[]; // Pool, Gym, Parking, etc.
  nearbyFacilities?: NearbyFacilities;
  
  // Viewing & Contact
  viewingSchedule?: Array<{
    date: Date;
    timeSlot: string;
    isBooked: boolean;
    bookedBy?: Types.ObjectId;
  }>;
  contactPreference?: 'phone' | 'email' | 'both';
  showContactInfo?: boolean;
  
  // Statistics & Engagement
  views?: number;
  favorites?: number;
  inquiries?: number;
  shareCount?: number;
  
  // SEO & Marketing
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  
  // Featured & Boost
  isFeatured?: boolean;
  featuredUntil?: Date;
  isPremium?: boolean;
  premiumUntil?: Date;
  
  // Verification
  isVerified?: boolean;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  
  // Availability
  availableFrom?: Date;
  expiresAt?: Date;
  
  // Additional fields
  uniqueFeatures?: string[]; // Custom unique selling points
  restrictions?: string[]; // Any restrictions or covenants
  notes?: string; // Internal notes
  
  createdAt?: Date;
  updatedAt?: Date;
}

export const PropertySchema = new Schema<IProperty>({
  // Basic Information
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200,
    index: 'text'
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 5000,
    index: 'text'
  },
  propertyType: { 
    type: String, 
    enum: Object.values(PropertyType),
    required: true,
    index: true
  },
  propertySubType: { 
    type: String, 
    enum: Object.values(PropertySubType),
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: Object.values(PropertyStatus),
    default: PropertyStatus.DRAFT,
    index: true
  },
  listingType: { 
    type: String, 
    enum: Object.values(ListingType),
    required: true,
    index: true
  },
  
  // Owner/Agent Information
  ownerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  agentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  isDeveloperProperty: { type: Boolean, default: false },
  developerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Developer'
  },
  
  // Location
  addressId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Address',
    required: true,
    index: true
  },
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  
  // Property Details
  features: { 
    type: PropertyFeaturesSchema,
    required: true
  },
  pricing: { 
    type: PricingInfoSchema,
    required: true
  },
  
  // Media
  images: { 
    type: [FileInfoSchema],
    validate: {
      validator: function(v: FileInfo[]) {
        return v && v.length > 0;
      },
      message: 'At least one image is required'
    }
  },
  videos: [FileInfoSchema],
  virtualTour: { type: String },
  floorPlans: [FileInfoSchema],
  
  // Documents
  documents: PropertyDocumentsSchema,
  
  // Additional Information
  yearBuilt: { 
    type: Number,
    min: 1800,
    max: new Date().getFullYear() + 5
  },
  lastRenovated: { 
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  propertyCondition: { 
    type: String, 
    enum: Object.values(PropertyCondition)
  },
  ownershipType: { 
    type: String, 
    enum: Object.values(OwnershipType),
    default: OwnershipType.FREEHOLD
  },
  occupancyStatus: { 
    type: String, 
    enum: ['vacant', 'occupied', 'under_construction'],
    default: 'vacant'
  },
  possessionDate: { type: Date },
  
  // Legal & Compliance
  rera: { type: String, trim: true },
  propertyTaxId: { type: String, trim: true },
  utilityAccounts: {
    electricity: { type: String },
    water: { type: String },
    gas: { type: String }
  },
  
  // Amenities & Nearby
  amenities: [{ type: String, trim: true }],
  nearbyFacilities: NearbyFacilitiesSchema,
  
  // Viewing & Contact
  viewingSchedule: [{
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  contactPreference: { 
    type: String, 
    enum: ['phone', 'email', 'both'],
    default: 'both'
  },
  showContactInfo: { type: Boolean, default: true },
  
  // Statistics & Engagement
  views: { type: Number, default: 0, index: true },
  favorites: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  
  // SEO & Marketing
  slug: { 
    type: String, 
    unique: true, 
    sparse: true,
    index: true
  },
  metaTitle: { type: String, maxlength: 60 },
  metaDescription: { type: String, maxlength: 160 },
  keywords: [{ type: String, trim: true }],
  
  // Featured & Boost
  isFeatured: { type: Boolean, default: false, index: true },
  featuredUntil: { type: Date },
  isPremium: { type: Boolean, default: false, index: true },
  premiumUntil: { type: Date },
  
  // Verification
  isVerified: { type: Boolean, default: false, index: true },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  
  // Availability
  availableFrom: { type: Date },
  expiresAt: { type: Date, index: true },
  
  // Additional fields
  uniqueFeatures: [{ type: String, trim: true }],
  restrictions: [{ type: String, trim: true }],
  notes: { type: String, maxlength: 1000 }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
PropertySchema.index({ status: 1, propertyType: 1, listingType: 1 });
PropertySchema.index({ ownerId: 1, status: 1 });
PropertySchema.index({ 'pricing.salePrice': 1, 'pricing.rentPrice': 1 });
PropertySchema.index({ 'features.bedrooms': 1, 'features.bathrooms': 1 });
PropertySchema.index({ createdAt: -1 });
PropertySchema.index({ isFeatured: 1, isPremium: 1, createdAt: -1 });

// Text index for search
PropertySchema.index({ 
  title: 'text', 
  description: 'text',
  amenities: 'text'
});

// Virtual for address population
PropertySchema.virtual('address', {
  ref: 'Address',
  localField: 'addressId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to generate slug
PropertySchema.pre('save', async function(next) {
  if (this.isModified('title') && !this.slug) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.model('Property').findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  // Auto-expire featured/premium status
  if (this.featuredUntil && this.featuredUntil < new Date()) {
    this.isFeatured = false;
  }
  if (this.premiumUntil && this.premiumUntil < new Date()) {
    this.isPremium = false;
  }
  
  next();
});

// Method to check if property is available
PropertySchema.methods.isAvailable = function(): boolean {
  return this.status === PropertyStatus.ACTIVE && 
         (!this.expiresAt || this.expiresAt > new Date());
};

// Method to increment views
PropertySchema.methods.incrementViews = async function() {
  this.views = (this.views || 0) + 1;
  await this.save();
};

export const PropertyModel = model<IProperty>('Property', PropertySchema);