import { injectable, inject } from 'inversify';
import { IProfile } from '../models/Profile';
import ProfileModel from '../models/Profile';
import { TYPES } from '../config/types';
import { Model } from "mongoose"
import { BaseRepository } from '../core/BaseRepository';

@injectable()
export class ProfileRepository extends BaseRepository<IProfile> {
  constructor(
    @inject(TYPES.ProfileModel) private readonly userModel: Model<IProfile>
  ) {
    super(ProfileModel);
  }

  async create(data: Partial<IProfile>, userId: string): Promise<IProfile> {
    // Check if profile already exists for this user
    // try {
    //   // Check if profile already exists for this user
    //   const existingProfile = await ProfileModel.findOne({ user: userId, isDeleted: false });
    //   if (existingProfile) {
    //     throw ApiError.badRequest('Profile already exists for this user');
    //   }

    //   const profile = new ProfileModel({
    //     ...data,
    //     user: userId,
    //   });

    //   return await profile.save();
    // } catch (error) {
    //   throw ApiError.internal(`Failed to create profile: ${error.message}`);
    // }
    return await ProfileModel.findOneAndUpdate({ user: userId }, data, { new: true });
  }



  async findById(id: string): Promise<IProfile | null> {
    return ProfileModel.findById(id);
  }
  async findUserById(userId: string): Promise<IProfile | null> {
    return ProfileModel.findOne({ user: userId }).populate({
      path: "user",
      select: "email phoneNumber"
    });
  }
  // Update Profile by UserId
  async updateProfileByUserId(
    userId: string,
    update: Partial<IProfile>
  ): Promise<IProfile | null> {
    return ProfileModel.findOneAndUpdate(
      { user: userId },
      update,
      { new: true }
    );
  }

  async update(id: string, data: Partial<IProfile>): Promise<IProfile | null> {
    return ProfileModel.findOneAndUpdate({ user: id }, data, { new: true });
  }


  async findAll(): Promise<IProfile[]> {
    return ProfileModel.find({ isDeleted: false });
  }

  async searchProfilesByName(firstName: string, lastName: string, excludeUserId: string) {
    try {
      const searchCriteria: any = {
        isDeleted: false,
        isActive: true
      };

      // Build search criteria for firstName and lastName
      if (firstName && lastName) {
        searchCriteria.$and = [
          { firstName: { $regex: firstName, $options: 'i' } },
          { lastName: { $regex: lastName, $options: 'i' } }
        ];
      } else if (firstName) {
        searchCriteria.firstName = { $regex: firstName, $options: 'i' };
      } else if (lastName) {
        searchCriteria.lastName = { $regex: lastName, $options: 'i' };
      } else {
        throw new Error('Either firstName or lastName must be provided');
      }

      // Exclude the current user
      searchCriteria.user = { $ne: excludeUserId };

      const profiles = await ProfileModel.find({ ...searchCriteria })
        .populate('user', 'email userID phoneNumber status') // Populate user details
        .select('-isDeleted -isActive') // Exclude unnecessary fields
        .limit(50); // Limit results for performance

      return profiles;
    } catch (error) {
      throw new Error(`Error searching profiles: ${error.message}`);
    }
  }

}
