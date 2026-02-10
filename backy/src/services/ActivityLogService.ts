import { inject, injectable } from 'inversify';
import { IActivityLogRepository } from '../repositories/ActivityLogRepository';
import { IActivityLog, ActivityType, ActivityStatus } from '../models/ActivityLog';
import { TYPES } from '../config/types';

export interface IActivityLogService {
  logActivity(activityData: Partial<IActivityLog>): Promise<IActivityLog>;
  getVendorActivities(vendorId: string): Promise<IActivityLog[]>;
  getUserActivities(vendorId: string): Promise<IActivityLog[]>;
  getSystemAlerts(): Promise<IActivityLog[]>;
  markActivityAsResolved(activityId: string): Promise<IActivityLog | null>;
}

@injectable()
export class ActivityLogService implements IActivityLogService {
  constructor(
    @inject(TYPES.ActivityLogRepository) 
    private repository: IActivityLogRepository
  ) {}

  async logActivity(activityData: Partial<IActivityLog>): Promise<IActivityLog> {
    return this.repository.create(activityData);
  }

  async getVendorActivities(vendorId: string): Promise<IActivityLog[]> {
    return this.repository.findByVendor(vendorId);
  }
  async getUserActivities(userId: string): Promise<IActivityLog[]> {
    return this.repository.findByUser(userId);
  }

  async getSystemAlerts(): Promise<IActivityLog[]> {
    return this.repository.findByType(ActivityType.SYSTEM_ALERT);
  }

  async markActivityAsResolved(activityId: string): Promise<IActivityLog | null> {
    // In a real implementation, we would update the status
    return this.repository.findById(activityId);
  }
}