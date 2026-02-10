import { injectable } from 'inversify';
import NotificationPreference, { INotificationPreference } from '../models/NotificationPreference';
import { Types } from 'mongoose';


@injectable()
export class NotificationPreferenceRepository {
  async findByUserId(userId: Types.ObjectId): Promise<INotificationPreference | null> {

    const preferences = await NotificationPreference.findOne({ user: userId });;
    if (!preferences) {
      return this.createDefaultPreferences(userId);
    }
    return preferences;
  }

  async createDefaultPreferences(
    userId: Types.ObjectId
  ): Promise<INotificationPreference> {
    return NotificationPreference.create({ user: userId });
  }

  async updatePreferences(
    userId: Types.ObjectId,
    updateData: Partial<INotificationPreference>
  ): Promise<INotificationPreference | null> {
    return NotificationPreference.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { new: true, upsert: true }
    );
  }
}
