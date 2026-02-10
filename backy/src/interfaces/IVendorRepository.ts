import { IAddress } from '../models/Address';
import { FileInfo } from '../models/File';
import { IVendorPayout, PayoutStatus } from '../models/Payouts';
import { AccessLevel } from '../models/Permissions';
import { IVendor } from '../models/Vendor';
import { Types } from 'mongoose';
export interface IVendorStats {
  totalVendors: number;
  activeVendors: number;
  flaggedVendors: number;
  totalPercentageChange: number;
  activePercentageChange: number;
  flaggedPercentageChange: number;
}

// Define interfaces for the plain objects returned by lean()
export interface PopulatedUser {
  _id: Types.ObjectId;
  userID: string;
  email: string;
  phoneNumber: string;
  status: boolean;
}

export interface VendorLean extends Omit<IVendor, 'user'> {
  _id: Types.ObjectId;
  user: PopulatedUser;
  address: any;
  createdAt: Date;
  updatedAt: Date;
}


export interface GetVendorsByCategoryDTO {
  categoryIds?: string[];
  minRating?: number;
  sortBy?: 'followers' | 'joined';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface VendorWithCount extends VendorLean {
  vendorID: string;
  productCount: number;
}

// Define the result structure for findMany
export interface PaginatedVendorResult {
  data: IVendor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
// Generic pagination interface
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IVendorRepository {
  findByUserId(userId: string): Promise<IVendor | null>;
  findByVendorId(vendorId: string): Promise<IVendor | null>;
  create(vendorData: Partial<IVendor>, addressData: IAddress): Promise<IVendor>
  // flagVendor(vendorsId: string[], flagged: boolean): Promise<IVendor[] | null>;
  // // unflagVendor(vendorsId: string[], flagged: boolean): Promise<IVendor[] | null>;
  // unflagVendor(vendorsId: string[], options: {
  //   clearBlacklist?: boolean;
  //   clearReasons?: boolean;
  //   populate?: string[];
  // }): Promise<IVendor[] | null>

  flagVendor(
    vendorIds: string[],
    userId: string,
    reason: string,
    media: FileInfo
  ): Promise<IVendor[] | null>
  unflagVendor(
    vendorIds: string[],
    userId?: string,
    options?: {
      clearBlacklist?: boolean;
      clearReasons?: boolean;
      clearAllFlags?: boolean;
      populate?: string[];
    }
  ): Promise<IVendor[] | null>  

  getPendingVerificationsCount(): Promise<number>;
  getActiveVendorsCount(startDate: Date, endDate: Date): Promise<number>
  followVendor(vendorId: Types.ObjectId, userId: Types.ObjectId),
  unfollowVendor(vendorId: Types.ObjectId, userId: Types.ObjectId)

  getVendorWithReviewStats(vendorId: string): Promise<IVendor | null>
  findMany(
    filters: {
      search?: string;
      verified?: boolean;
      flagged?: boolean;
      minPerformance?: number;
      maxPerformance?: number;
      city?: string;
      state?: string;
      country?: string;
      taxId?: string;
      vendorID?: string;
    },
    pagination: {
      page: number;
      pageSize: number;
    },
    sort?: {
      field: string;
      direction: 'asc' | 'desc';
    }
  ): Promise<PaginatedResult<VendorWithCount>>;
  updateVerificationStatuses(vendorIds: string[], verified: boolean): Promise<IVendor[] | null>;

  getVendorStats(): Promise<{
    totalVendors: number;
    activeVendors: number;
    flaggedVendors: number;
    previousMonthStats: {
      totalVendors: number;
      activeVendors: number;
      flaggedVendors: number;
    };
  }>
  getUnverifiedVendors(): Promise<IVendor[]>;
  getUnverifiedVendorsCount(): Promise<number>;
  runAnalyticsQuery(
    vendorId: Types.ObjectId,
    dateFilter: any,
    categoryFilter: any
  ) 

  blacklistVendor(
    vendorId: string,
    blacklisted: boolean,
    adminUserId: string,
    reason?: string
  ): Promise<IVendor | null>;

  revokeVerification(
    vendorId: string,
    revoked: boolean,
    adminUserId: string,
    reason?: string
  ): Promise<IVendor | null>;
  updateVendor(vendorId: string, updateData: Partial<IVendor>): Promise<IVendor | null>
  getFollowedVendorsByUserId(userId: Types.ObjectId): Promise<FollowedVendor[]>
  getFollowedVendorsCount(userId: Types.ObjectId): Promise<number>
  markOrdersAsPaid(orderIds: Types.ObjectId[], payoutId: string)
  getPayoutHistory(vendorId: Types.ObjectId, limit:number, skip: number)
  getUnpaidBalance(vendorId: Types.ObjectId): Promise<number>
  getPayoutByStripeId(stripePayoutId: string): Promise<IVendorPayout | null> 
  updatePayoutStatus(
    payoutId: Types.ObjectId,
    status: PayoutStatus,
    stripePayoutId?: string,
    arrivalDate?: Date,
    failureReason?: string
  ): Promise<IVendorPayout>
  getPendingPayouts(vendorId: Types.ObjectId)  
  createPayout(data: Partial<IVendorPayout>): Promise<IVendorPayout> 
  getVendorWithStripeAccount(vendorId: Types.ObjectId) 
  getAllPayouts(page: number, limit: number)
  findVendorsWithSearchOptions(query: GetVendorsByCategoryDTO)
}


export interface AssignPermissionDTO {
  user: Types.ObjectId;
  permissions: {
    permission: Types.ObjectId;
    accessLevel: AccessLevel[];
  }[];
}

export interface UserPermissionResponseDTO {
  userId: string;
  permissions: {
    permission: string;
    accessLevel: AccessLevel[];
  }[];
}

export interface FollowedVendor {
  _id: Types.ObjectId;
  user: {
    _id: Types.ObjectId;
    email: string;
    userID: string;
    role: string;
    status: string;
    profile?: {
      _id: Types.ObjectId;
      firstName: string;
      lastName: string;
      photo?: any[];
      jobTitle?: string;
    };
  };
  storeName: string;
  storeDescription?: string;
  logo?: any[];
  taxId: string;
  address: any;
  website?: string;
  verified: boolean;
  categories: any[];
  followers: Types.ObjectId[];
  performance: number;
  totalReviews: number;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}


export interface FollowedVendorsResponse {
  success: boolean;
  data: FollowedVendor[];
  count: number;
  message?: string;
}