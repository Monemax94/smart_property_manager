import { injectable } from 'inversify';
import { ActivityLog, IActivityLog, ActivityType } from '../models/ActivityLog';

export interface IActivityLogRepository {
  create(activity: Partial<IActivityLog>): Promise<IActivityLog>;
  findById(id: string): Promise<IActivityLog | null>;
  findByVendor(vendorId: string, limit?: number): Promise<IActivityLog[]>;
  findByUser(userId: string, limit?: number): Promise<IActivityLog[]>;
  findByType(type: ActivityType, limit?: number): Promise<IActivityLog[]>;
  getRecentActivities(limit?: number): Promise<IActivityLog[]>;
}

@injectable()
export class ActivityLogRepository implements IActivityLogRepository {
  async create(activity: Partial<IActivityLog>): Promise<IActivityLog> {
    return await ActivityLog.create(activity);
  }

  async findById(id: string): Promise<IActivityLog | null> {
    return ActivityLog.findById(id).exec();
  }

  async findByVendor(vendorId: string, limit = 10): Promise<IActivityLog[]> {
    return ActivityLog.find({ vendor: vendorId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
  async findByUser(userId: string, limit = 10): Promise<IActivityLog[]> {
    return ActivityLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findByType(type: ActivityType, limit = 10): Promise<IActivityLog[]> {
    return ActivityLog.find({ activityType: type })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getRecentActivities(limit = 10): Promise<IActivityLog[]> {
    return ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}