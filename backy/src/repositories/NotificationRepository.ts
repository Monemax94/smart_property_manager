import { injectable } from 'inversify';
import { INotification, NotificationModel, NotificationStatus, RecipientType } from '../models/Notification';
import { Types } from 'mongoose';

interface NotificationStats {
  total: number;
  read: number;
  unread: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

@injectable()
export class NotificationRepository {
  async create(data: any) {
    return NotificationModel.create(data);
  }

  async update(id: string, data: any) {
    return NotificationModel.findByIdAndUpdate(id, data, { new: true });
  }

  async getById(id: string) {
    return NotificationModel.findById(id);
  }

  async getAll(filters: any, page: number, limit: number, search: string) {
    const query: any = {};

    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.recipient) query.recipients = filters.recipient;
    if (filters.published !== undefined) query.published = filters.published;

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      NotificationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationModel.countDocuments(query)
    ]);

    return { data, total, page, limit };
  }

  async addClick(notificationId: string, userId: string): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        clicks: { $ne: userId }
      },
      {
        $addToSet: { clicks: userId }
      },
      { new: true }
    ).exec();
  }

  async updateStatus(notificationId: string, newStatus: NotificationStatus): Promise<INotification | null> {
    return NotificationModel.findByIdAndUpdate(
      notificationId,
      { status: newStatus },
      { new: true }
    ).exec();
  }

  // Additional repository methods
  async getUserNotifications(userId: string, page: number, limit: number, unreadOnly: boolean = false) {
    const query: any = { 
      recipients: { $in: [RecipientType.ALL_VENDORS, RecipientType.BUYERS, RecipientType.CUSTOMERS] }
    };

    if (unreadOnly) {
      query.clicks = { $ne: userId };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      NotificationModel.countDocuments(query)
    ]);

    return { data, total, page, limit };
  }

  async markAllAsRead(userId: string) {
    const result = await NotificationModel.updateMany(
      { 
        recipients: { $in: [RecipientType.ALL_VENDORS, RecipientType.BUYERS, RecipientType.CUSTOMERS] },
        clicks: { $ne: userId }
      },
      { $addToSet: { clicks: userId } }
    );

    return { modifiedCount: result.modifiedCount };
  }

  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const stats = await NotificationModel.aggregate([
      {
        $match: {
          recipients: { $in: [RecipientType.ALL_VENDORS, RecipientType.BUYERS, RecipientType.CUSTOMERS] }
        }
      },
      {
        $facet: {
          total: [{ $count: 'count' }],
          read: [
            { $match: { clicks: userId } },
            { $count: 'count' }
          ],
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const result = stats[0];
    
    return {
      total: result.total[0]?.count || 0,
      read: result.read[0]?.count || 0,
      unread: (result.total[0]?.count || 0) - (result.read[0]?.count || 0),
      byType: result.byType.reduce((acc: Record<string, number>, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byStatus: result.byStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }

  async deleteNotification(notificationId: string, userId: string) {
    // For now, allow any user to delete any notification
    return NotificationModel.findByIdAndDelete(notificationId);
  }

  async bulkUpdateStatus(notificationIds: string[], status: NotificationStatus, userId: string) {
    const result = await NotificationModel.updateMany(
      { _id: { $in: notificationIds } },
      { status: status }
    );

    return { modifiedCount: result.modifiedCount };
  }
}