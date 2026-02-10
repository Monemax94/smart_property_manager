import { injectable, inject } from 'inversify';
import { BaseRepository } from '../core/BaseRepository';
import { IUserRepository, PaginationOptions, AdminFilterOptions } from '../interfaces/IUserRepository';
import { IUserDocument, UserRole, UserStatus } from '../models/User';
import mongoose, { Model, Types } from 'mongoose';
import { TYPES } from '../config/types';
import ProfileModel, { IProfile } from '../models/Profile';
import VendorModel, { IVendor } from '../models/Vendor';
import { AddressModel, IAddress } from '../models/Address';
import { FilterQuery } from 'mongoose';
import { UserPermissionModel } from '../models/UserPermission';
import { ActivityLog } from '../models/ActivityLog';
import { SessionModel } from '../models/Session';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { startOfMonth, endOfMonth } from 'date-fns';

@injectable()
export class UserRepository
  extends BaseRepository<IUserDocument>
  implements IUserRepository {
  constructor(
    @inject(TYPES.UserModel) private readonly userModel: Model<IUserDocument>,
    @inject(TYPES.AddressModel) private readonly addressRepo: Model<IAddress>
  ) {
    super(userModel);
  }

  create = async (userData: Omit<IUserDocument, 'createdAt' | 'updatedAt'>): Promise<IUserDocument> => {
    const newUser = new this.userModel(userData);
    const user = await newUser.save();

    const profile = await ProfileModel.create({ user: user._id });
    user.profile = profile._id as Types.ObjectId;
    await user.save();
    return user;
  }

  // createUser = async (userData: Partial<IUserDocument>, profileData: Partial<IProfile>): Promise<IUserDocument> =>{
  //   const savedProfile = await ProfileModel.create(profileData); // create and save profile
  //   const user = await this.userModel.create({ ...userData, profile: savedProfile._id });
  //   return user;
  // }

  createUser = async (userData: Partial<IUserDocument>, profileData: any): Promise<IUserDocument> => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      // 1. Create user first
      const user = await this.userModel.create([userData], { session });
      
      // 2. Attach user._id to profile
      const profile = await ProfileModel.create(
        [{ 
           ...profileData, 
           user: user[0]._id 
        }],
        { session }
      );
  
      await session.commitTransaction();
      session.endSession();
  
      return user[0];
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
  

  createVendorAddon = async (vendorData: Partial<IVendor>, addressData: IAddress): Promise<IVendor> => {
    // Create address first
    const address = this.addressRepo.create(addressData);

    // Attach address to vendor
    const vendor = new VendorModel({
      ...vendorData,
      address
    });

    return await vendor.save();
  }

  createVendor = async (userData: Omit<IUserDocument, 'createdAt' | 'updatedAt'>, vendorData: Partial<IVendor>) => {
    // 1. Create User
    const user = await this.create({
      ...userData,
      role: UserRole.VENDOR
    });

    // 2. Create Vendor profile
    const vendor = await VendorModel.create({
      ...vendorData,
      user: user._id
    });

    // 3. connect vendor to user
    const newUser = this.update(user?._id.toString(), { vendor: vendor?._id })

    return { user: newUser, vendor };
  }


  async findByEmail(email: string): Promise<IUserDocument | null> {
    return this.userModel
      .findOne({ email })
      .populate("profile")
      .populate({
        path: "vendor",
        populate: {
          path: "categories",
          model: "Category",
          select: "name description status images createdAt updatedAt"
        }
      })
      .exec();
  }
  async findByRecoveryEmail(email: string): Promise<IUserDocument[] | null> {
    return this.userModel
      .find({ recoveryEmail: email })
      .populate('profile')
      .exec();
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return this.userModel.findById(id).populate("profile").exec();
  }

  async update(id: string, user: Partial<IUserDocument>): Promise<IUserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, user, { new: true }).exec();
  }

  async verifyUser(userId: string): Promise<boolean> {
    const result = await this.userModel.updateOne({ _id: userId }, { verified: true });
    return result.modifiedCount > 0;
  }

  async deactivateAccount(userId: string): Promise<boolean> {
    const result = await this.userModel.updateOne({ _id: userId }, { isActive: false });
    return result.modifiedCount > 0;
  }

  async deleteAccount(userId: Types.ObjectId): Promise<boolean> {
    const result = await this.userModel.updateOne({ _id: userId }, { isDeleted: true });
    return result.modifiedCount > 0;
  }

  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) return false;

    user.password = newPassword;
    await user.save();
    return true;
  }

  async getActiveUsers(): Promise<IUserDocument[]> {
    return this.userModel.find({ isActive: true }).exec();
  }
  async findUserById(userId: Types.ObjectId) {
    // Fetch the user and populate the profile
    const user = await this.userModel.findOne({ _id: userId, isDeleted: false })
      .select('-password -role -activityLog')
      .populate({
        path: 'profile',
        model: 'Profile',
        match: { isDeleted: false },
        select: '-__v -isDeleted',
      })
      .populate({
        path: 'deactivatedBy',
        model: 'User',
        select: 'email phoneNumber'
      })
      .exec();

    if (!user) return null;

    // Get default address for the user
    const defaultAddress = await AddressModel.findOne({
      userId,
      isDefault: true
    }).lean();

    // Attach the default address manually
    const userWithAddress = {
      ...user.toObject(),
      defaultAddress
    };

    return userWithAddress;
  }

  async getActivityLog(userId: string) {
    const user = await this.userModel.findById(userId).select('activityLog');
    return user?.activityLog || [];
  }

  async getAdminStatistics() {
    const adminRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

    const [total, active, revoked] = await Promise.all([
      this.userModel.countDocuments({ role: { $in: adminRoles } }),
      this.userModel.countDocuments({
        role: { $in: adminRoles },
        isActive: true,
        isDeleted: false
      }),
      this.userModel.countDocuments({
        role: { $in: adminRoles },
        $or: [{ isActive: false }, { isDeleted: true }]
      })
    ]);

    return { total, active, revoked };
  }

  async getPaginatedAdmins(
    filters: AdminFilterOptions = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ) {
    const { search, status, role } = filters;
    const { page, limit } = pagination;

    const query: FilterQuery<any> = {
      role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }
    };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { email: searchRegex },
        { phoneNumber: searchRegex },
        { userID: searchRegex }
      ];
    }

    if (status) query.status = status;
    if (role) query.role = role;

    // Get users with populated profile
    const users = await this.userModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password -loginHistory -currentSessions')
      .populate({
        path: 'profile',
        select: 'firstName lastName photo jobTitle'
      })
      .lean();

    // Get user IDs for permission and activity log queries
    const userIds = users.map(u => u._id);

    // Fetch permissions and activity logs in parallel
    const [userPermissions, activityLogs] = await Promise.all([
      UserPermissionModel.find({ user: { $in: userIds } })
        .populate({
          path: 'permissions.permission',
          select: 'module accessLevel'
        })
        .lean(),
      ActivityLog.find({ user: { $in: userIds } })
        .sort({ createdAt: -1 })
        .limit(5) // Last 5 activity logs per user
        .lean()
    ]);

    // Create maps for quick lookup
    const permissionsMap = new Map(
      userPermissions.map(up => [up.user.toString(), up.permissions])
    );

    const activityLogsMap = new Map();
    activityLogs.forEach(log => {
      const userId = log.user.toString();
      if (!activityLogsMap.has(userId)) {
        activityLogsMap.set(userId, []);
      }
      activityLogsMap.get(userId).push(log);
    });

    // Enrich users with permissions and activity logs
    const admins = users.map(user => ({
      ...user,
      permissions: permissionsMap.get(user._id.toString()) || [],
      activityLogs: activityLogsMap.get(user._id.toString()) || []
    }));

    const totalCount = await this.userModel.countDocuments(query);

    return { admins, totalCount };
  }
  async getUserInfo(
    userId: Types.ObjectId,
    roles?: UserRole[]
  ) {
    // Build base query
    const query: any = { _id: userId };
    if (roles && roles.length > 0) {
      query.role = { $in: roles };
    }

    // Get user with populated profile
    const user = await this.userModel.findOne(query)
      .select('-password -loginHistory -currentSessions')
      .populate({
        path: 'profile',
        select: 'firstName lastName photo jobTitle'
      })
      .lean();

    if (!user) {
      return null;
    }

    // Fetch permissions and activity logs in parallel
    const [userPermissions, activityLogs] = await Promise.all([
      UserPermissionModel.findOne({ user: userId })
        .populate({
          path: 'permissions.permission',
          select: 'module accessLevel'
        })
        .lean(),
      ActivityLog.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    // Enrich user with permissions and activity logs
    return {
      ...user,
      permissions: userPermissions?.permissions || [],
      activityLogs: activityLogs || []
    };
  }

  async suspendAdmin(adminId: string, suspendedBy: string) {
    // Validate ObjectID formats
    if (!Types.ObjectId.isValid(adminId)) {
      throw ApiError.validationError('Invalid admin ID');
    }
    if (!Types.ObjectId.isValid(suspendedBy)) {
      throw ApiError.badRequest('Invalid suspendedBy ID');
    }
    const admin = await this.userModel.findById(adminId);

    // Check if admin exists
    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    // Verify admin role
    if (admin.role !== UserRole.ADMIN && admin.role !== UserRole.SUPER_ADMIN) {
      throw ApiError.forbidden('User is not an admin');
    }

    // Check if already suspended
    if (!admin.isDeleted) {
      throw ApiError.badRequest('Admin is already suspended');
    }

    // Prevent self-suspension
    if (admin._id.toString() === suspendedBy) {
      throw ApiError.badRequest('You cannot suspend yourself');
    }
    // Update admin status
    admin.isActive = false;
    admin.isDeleted = true;
    admin.deactivatedBy = new Types.ObjectId(suspendedBy);
    admin.currentSessions = []; // Clear active sessions
    admin.status = UserStatus.OFFLINE; // Set status to offline

    await admin.save();

    // Return safe user object without sensitive data
    const adminObj = admin.toObject();
    delete adminObj.password;
    delete adminObj.loginHistory;
    delete adminObj.activityLog;

    return adminObj;
  }

  async logout(refreshToken: string) {
    // Verify token to get user ID
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT!
    ) as { id: string };

    const userId = new Types.ObjectId(decoded.id);

    // Find and delete session
    const session = await SessionModel.findOneAndDelete({
      token: refreshToken,
      userId: userId
    });

    if (!session) {
      throw new Error('Invalid session or already logged out');
    }

    // Remove session from user's current sessions
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { currentSessions: session._id }
    });

    await this.userModel.findByIdAndUpdate(userId, {
      status: UserStatus.OFFLINE
    });

    return { userId: decoded.id };
  }

  async toggleTwoFactor(userId: Types.ObjectId): Promise<IUserDocument | null> {
    const user = await this.userModel.findById(userId);
    if (!user) return null;

    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();
    return user;
  }

  // Count new buyers (customers created this month)
  async countNewBuyersByMonth(year: number, month: number) {
    return this.userModel.countDocuments({
      role: UserRole.CUSTOMER,
      createdAt: {
        $gte: startOfMonth(new Date(year, month)),
        $lte: endOfMonth(new Date(year, month))
      }
    });
  }

  

  // Count returning buyers (customers with at least 1 login in that month)
  async countReturningBuyersByMonth(year: number, month: number) {
    return this.userModel.countDocuments({
      role: UserRole.CUSTOMER,
      "loginHistory.timestamp": {
        $gte: startOfMonth(new Date(year, month)),
        $lte: endOfMonth(new Date(year, month))
      }
    });
  }


  // Count vendors created this month
  async countNewVendorsByMonth(year: number, month: number) {
    return this.userModel.countDocuments({
      role: UserRole.VENDOR,
      createdAt: {
        $gte: startOfMonth(new Date(year, month)),
        $lte: endOfMonth(new Date(year, month))
      }
    });
  }

  // Count demographics by country

  async countCustomersByRegion(regionList: string[]) {
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      { $match: { "user.role": UserRole.CUSTOMER } },
      {
        $match: {
          country: { $in: regionList }
        }
      },
      {
        // Ensure unique customer count
        $group: {
          _id: "$userId"
        }
      },
      { $count: "total" }
    ];

    const result = await AddressModel.aggregate(pipeline);

    return result.length ? result[0].total : 0;
  }
  

  // Count devices from loginHistory
  async countDeviceUsage() {
    const pipeline = [
      { $unwind: "$loginHistory" },
      { $group: { _id: "$loginHistory.userAgent", count: { $sum: 1 } } }
    ];

    return this.userModel.aggregate(pipeline);
  }

  // Active sessions in last 30 minutes
  async getActiveSessions() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return this.userModel.countDocuments({
      lastActiveAt: { $gte: thirtyMinutesAgo }
    });
  }

}

