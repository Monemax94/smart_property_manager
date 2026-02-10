import mongoose, { Types } from 'mongoose';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { ApplicationPreferenceRepository } from '../repositories/ApplicationPreferenceRepository';
import { NotificationPreferenceRepository } from '../repositories/NotificationPreferenceRepository';
import { IApplicationPreference } from '../models/ApplicationPreferences';
import { UserRepository } from '../repositories/UserRepository';
import { INotificationPreference } from '../models/NotificationPreference';
import { ApiError } from '../utils/ApiError';

@injectable()
export class PreferenceService   {
  constructor(
    @inject(TYPES.UserRepository) private userRepo: UserRepository,
    @inject(TYPES.NotificationPreferenceRepository) private notificationPrefs: NotificationPreferenceRepository,
    @inject(TYPES.ApplicationPreferenceRepository) private applicationPreferenceRepository: ApplicationPreferenceRepository
  ) {}


  async getUserProfileWithNotifcationPreferences(userId: Types.ObjectId) {
    const [user, preferences] = await Promise.all([
      this.userRepo.findUserById(userId),
      this.notificationPrefs.findByUserId(userId)
    ]);

    const {password, ...userData} = user

    return {
      ...{userData},
      notificationPreferences: preferences || {}
    };
  }

  async updateNotificationPreferences(
    userId: Types.ObjectId,
    updateData: Partial<INotificationPreference>
  ) {
    // First ensure user exists
    const user = await this.userRepo.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.notificationPrefs.updatePreferences(
      userId,
      updateData
    );
  }
  async getApplicationPreferences(userId: string) {
    const preferences = await this.applicationPreferenceRepository.findByUserId(userId);
    if (!preferences) {
      return this.applicationPreferenceRepository.createDefaultPreferences(userId);
    }
    return preferences;
  }

  // async createApplicationPreferences(
  //   userId: Types.ObjectId,
  //   data: Partial<IApplicationPreference>
  // ) {
  //   // Verify user exists
  //   const userExist = await this.userRepo.findById(userId.toString());
  //   if (!userExist) {
  //     throw new Error('User not found');
  //   }
    
  //   type ApplicationPreferenceCreate = Omit<IApplicationPreference, keyof mongoose.Document>;

  //   // Create with default values
  //   const defaultPreferences: ApplicationPreferenceCreate = {
  //     user: userId,
  //     darkMode: data.darkMode ?? false,
  //     defaultCurrency: data.defaultCurrency ?? 'USD',
  //     defaultLanguage: data.defaultLanguage ?? 'English',
  //     defaultTimezone: data.defaultTimezone ?? 'UTC (Coordinated Universal Time)',
  //     dateFormat: data.dateFormat ?? 'MM/DD/YYYY'
  //   };
  
  //   return this.applicationPreferenceRepository.createDefaultPreferences(defaultPreferences);
  // }
  async updateApplicationPreferences(
    userId: Types.ObjectId,
    updateData: Partial<IApplicationPreference>
  ) {
    // Verify user exists
    const user = await this.userRepo.findById(userId.toString());
    if (!user) {
      throw  ApiError.notFound('User not found');
    }

    return this.applicationPreferenceRepository.updatePreferences(
      userId,
      updateData
    );
  }
}