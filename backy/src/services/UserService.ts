import { inject, injectable } from 'inversify';
import { IUserRepository, AdminFilterOptions, PaginationOptions } from '../interfaces/IUserRepository';
import { TYPES } from '../config/types';
import { IUser, IUserDocument, UserModel, UserRole } from '../models/User';
import { Types } from 'mongoose';
import { NotificationPreferenceRepository } from '../repositories/NotificationPreferenceRepository';


@injectable()
export class UserService {
  constructor(
    @inject(TYPES.IUserRepository) private userRepo: IUserRepository,
    @inject(TYPES.NotificationPreferenceRepository) private preferenceRepo: NotificationPreferenceRepository,

  ) { }

  async registerUser(userData: Omit<IUserDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    return this.userRepo.create(userData);
  }

  async getUserByGoogleId(googleId: string): Promise<IUserDocument | null> {
    return await UserModel.findOne({ googleId });
  }

  async getUserByEmail(email: string): Promise<IUserDocument | null> {
    return this.userRepo.findByEmail(email);
  }
  async getUsersByRecoveryEmail(email: string): Promise<any[] | null> {
    return this.userRepo.findByRecoveryEmail(email);
  }

  async verifyUser(userId: string): Promise<boolean> {
    return this.userRepo.verifyUser(userId);
  }

  async deactivateUser(userId: string): Promise<boolean> {
    return this.userRepo.deactivateAccount(userId);
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    return this.userRepo.updatePassword(userId, newPassword);
  }
  async updateRole(userId: string, role: UserRole){
    return this.userRepo.update(userId, {role});
  }

  async getAllActiveUsers(): Promise<IUser[]> {
    return this.userRepo.getActiveUsers();
  }
  async findById(userId: Types.ObjectId): Promise<IUserDocument> {
    return this.userRepo.findById(userId.toString());
  }


  async getUserById(userId: Types.ObjectId): Promise<IUserDocument | null> {
    // If your repository can't populate, use the model directly:
    const user = await UserModel.findById(userId)
      .populate('profile')
      .exec();
    return user;
  }
  async getActivityLog(userId: string) {
    return this.userRepo.getActivityLog(userId);
  }

  async getAdminStats() {
    return this.userRepo.getAdminStatistics();
  }
  async getUserInfo(userId: Types.ObjectId, role?: UserRole[]) {
    return this.userRepo.getUserInfo(userId, role);
  }
  async updateUserInfo(userId: Types.ObjectId, userData: Partial<IUserDocument>) {
    return this.userRepo.update(userId.toString(), userData);
  }

  async getPaginatedAdmins(
    filters: AdminFilterOptions = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ) {
    const { admins, totalCount } = await this.userRepo.getPaginatedAdmins(filters, pagination);

    return {
      admins,
      totalCount,
      page: pagination.page,
      totalPages: Math.ceil(totalCount / pagination.limit)
    };
  }

  async suspendAdmin(adminId: string, suspendedBy: string) {
    return this.userRepo.suspendAdmin(adminId, suspendedBy)
  }

  async toggleTwoFactor(userId: Types.ObjectId) {
    const user = await this.userRepo.toggleTwoFactor(userId);
    if (!user) {
        throw new Error('User not found');
    }
    return {
        success: true,
        twoFactorEnabled: user.twoFactorEnabled,
        message: `Two-factor authentication ${user.twoFactorEnabled ? 'enabled' : 'disabled'}`
    };
}

}
