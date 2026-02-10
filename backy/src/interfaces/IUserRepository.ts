import { Types } from 'mongoose';
import { IUser, IUserDocument, UserStatus, UserRole } from '../models/User';
import { IVendor } from '../models/Vendor';
import { IProfile } from '../models/Profile';
import { IAddress } from '../models/Address';
export interface AdminFilterOptions {
  search?: string;
  status?: UserStatus;
  role?: UserRole;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}
export interface IUserRepository  {
  /**
 * Creates a new user.
 * @param user - User data to create the user.
 * @returns A promise that resolves to the created user.
 */
  create(user: Partial<IUserDocument>, profileData?: Partial<IProfile>);

  /**
 * Creates a new user.
 * @param user - User data to create the user.
 * @returns A promise that resolves to the created user.
 */
  createVendor(userData: Omit<IUserDocument, 'createdAt' | 'updatedAt'>, vendorData: Partial<IVendor>);
  /**
   * Finds a user by their email address.
   * @param email - The email address of the user to find.
   * @returns A promise that resolves to the user object or null if not found.
   */
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByRecoveryEmail(email: string): Promise<IUserDocument[] | null>;
  // findUserById(id: Types.ObjectId): Promise<IUserDocument | null>;
  findUserById(id: Types.ObjectId);
  findById(id: string);
  getActivityLog(userId: string);
  verifyUser(userId: string): Promise<boolean>;
  update(id: string, user: Partial<IUserDocument>): Promise<IUserDocument | null>
  deactivateAccount(userId: string): Promise<boolean>;
  deleteAccount(userId: Types.ObjectId): Promise<boolean>;
  updatePassword(userId: string, newPassword: string): Promise<boolean>;
  getActiveUsers(): Promise<IUserDocument[]>;
  suspendAdmin(adminId: string, suspendedBy: string)
  toggleTwoFactor(userId: Types.ObjectId): Promise<IUserDocument | null>
  getAdminStatistics(): Promise<{
    total: number;
    active: number;
    revoked: number;
  }>;
  createUser (userData: Partial<IUserDocument>, profileData: Partial<IProfile>): Promise<IUserDocument>
  getPaginatedAdmins(
    filters: AdminFilterOptions,
    pagination: PaginationOptions
  ): Promise<{
    admins: any[];
    totalCount: number;
  }>;
  getUserInfo(
    userId: Types.ObjectId,
    roles?: UserRole[]
  ) 
  logout(refreshToken: string)
  getActiveSessions()
  countDeviceUsage()
  countCustomersByRegion(regionList: string[]) 
  countNewVendorsByMonth(year: number, month: number)
  countReturningBuyersByMonth(year: number, month: number)
  countNewBuyersByMonth(year: number, month: number)  
}
