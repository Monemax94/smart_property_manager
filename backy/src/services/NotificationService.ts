import { inject, injectable } from 'inversify';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { TYPES } from "../config/types";
import { INotification, NotificationStatus } from '../models/Notification';
import { Types } from 'mongoose';

interface NotificationStats {
  total: number;
  read: number;
  unread: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

@injectable()
export class NotificationService {
  constructor(@inject(TYPES.NotificationRepository) private repo: NotificationRepository) { }

  create(data: any) {
    return this.repo.create(data);
  }

  update(id: string, data: any) {
    return this.repo.update(id, data);
  }

  getById(id: string) {
    return this.repo.getById(id);
  }

  getAll(filters: any, page: number, limit: number, search: string) {
    return this.repo.getAll(filters, page, limit, search);
  }

  async addClick(notificationId: string, userId: string): Promise<INotification | null> {
    const updatedNotification = await this.repo.addClick(notificationId, userId);
    if (!updatedNotification) {
      throw new Error('Notification not found or user already clicked.');
    }
    return updatedNotification;
  }

  async updateStatus(notificationId: string, newStatus: NotificationStatus): Promise<INotification | null> {
    const notification = await this.repo.updateStatus(notificationId, newStatus);
    if (!notification) {
      throw new Error('Notification not found.');
    }
    return notification;
  }

  // Additional service methods
  async getUserNotifications(userId: string, page: number, limit: number, unreadOnly: boolean = false) {
    return this.repo.getUserNotifications(userId, page, limit, unreadOnly);
  }

  async markAllAsRead(userId: string) {
    return this.repo.markAllAsRead(userId);
  }

  async getNotificationStats(userId: string): Promise<NotificationStats> {
    return this.repo.getNotificationStats(userId);
  }

  async deleteNotification(notificationId: string, userId: string) {
    const deleted = await this.repo.deleteNotification(notificationId, userId);
    if (!deleted) {
      throw new Error('Notification not found or you do not have permission to delete it');
    }
    return deleted;
  }

  async bulkUpdateStatus(notificationIds: string[], status: NotificationStatus, userId: string) {
    // Validate all IDs
    for (const id of notificationIds) {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid notification ID: ${id}`);
      }
    }
    
    return this.repo.bulkUpdateStatus(notificationIds, status, userId);
  }
}