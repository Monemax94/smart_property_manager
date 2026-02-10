import { inject, injectable } from 'inversify';
import { IOrderTrackingRepository } from '../repositories/OrderTrackingRepository';
import { OrderStatus, ITrackingEvent, IOrder } from '../models/OrderModel';
import { TYPES } from '../config/types';
import { OrderRepository } from '../repositories/OrderRepository';
import { UserRole } from '../models/User';
import { ActivityLogService } from './ActivityLogService';
import { ActivityIcon, ActivityType, AlertLevel } from '../models/ActivityLog';
import { ApiError } from '../utils/ApiError';
import { FileInfo } from '../models/File';

export interface TrackingInfoDto {
  orderId: string;
  trackingNumber: string;
  trackingUrl: string;
  currentStatus: OrderStatus;
  estimatedDelivery?: Date;
  lastUpdate: Date;
  carrier?: string;
}

@injectable()
export class OrderTrackingService {

  // Allowed transitions:
  private STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.ORDER_PLACED]: [OrderStatus.SHIPPED, OrderStatus.ONGOING],
    [OrderStatus.PENDING]: [OrderStatus.SHIPPED, OrderStatus.ONGOING],
    [OrderStatus.PAYMENT_SUCCESS]: [OrderStatus.ORDER_PLACED, OrderStatus.SHIPPED],
    [OrderStatus.ONGOING]: [OrderStatus.SHIPPED, OrderStatus.DELIVERED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.CANCELLED, OrderStatus.RETURNED, OrderStatus.RETURNED, OrderStatus.REFUNDED],
    [OrderStatus.DELIVERED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.RETURNED, OrderStatus.REFUNDED, OrderStatus.DISPUTE],
    [OrderStatus.CONFIRMED]: [],
    [OrderStatus.DISPUTE]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.RETURNED]: [],
    [OrderStatus.REFUNDED]: []
  };

  constructor(
    @inject(TYPES.OrderTrackingRepository) private repository: IOrderTrackingRepository,
    @inject(TYPES.OrderRepository) private orderRepo: OrderRepository,
    @inject(TYPES.ActivityLogService) private activityService: ActivityLogService
  ) { }

  async startTracking(orderId: string, userId: string, userRole: UserRole): Promise<TrackingInfoDto> {
    const order = await this.repository.findById(orderId);
    if (!order) throw new Error('Order not found');

    // Authorization check
    if (userRole === UserRole.CUSTOMER && order.userId.toString() !== userId) {
      throw new Error('You can only track your own orders');
    }

    if (order.status !== OrderStatus.ONGOING) {
      throw ApiError.badRequest('Tracking can only start when order is out for delivery');
    }

    // Generate tracking details if they don't exist
    const trackingNumber = order.trackingNumber || await this.repository.generateTrackingNumber();
    const trackingUrl = order.trackingUrl || `https://tracking.example.com/${trackingNumber}`;

    // Update order with tracking info if not already set
    if (!order.trackingNumber) {
      await this.orderRepo.update(
        orderId,
        {
          trackingNumber,
          trackingUrl
        }
      );
    }

    return {
      orderId: order.orderId || order._id.toString(),
      trackingNumber,
      trackingUrl,
      currentStatus: order.status,
      estimatedDelivery: order.estimatedDelivery,
      lastUpdate: new Date(),
      carrier: order.carrier
    };
  }

  async addTrackingEvent(orderId: string, event: ITrackingEvent): Promise<IOrder | null> {
    return this.repository.addTrackingEvent(orderId, event);
  }

  async getTrackingInfo(orderId: string): Promise<ITrackingEvent[]> {
    return this.repository.getTrackingHistory(orderId);
  }

  async updateToOutForDelivery(orderId: string): Promise<IOrder | null> {
    // Generate tracking details
    const trackingNumber = await this.repository.generateTrackingNumber();
    const trackingUrl = `https://tracking.example.com/${trackingNumber}`;

    // Create tracking event
    const event: ITrackingEvent = {
      status: OrderStatus.SHIPPED,
      description: 'Package is out for delivery',
      location: 'Distribution Center',
      timestamp: new Date()
    };

    // Update order with tracking information and status
    const updates = await this.repository.updateOrderToOutForDelivery(
      orderId,
      event,
      trackingNumber,
      trackingUrl
    );
    if (updates) {
      await this.activityService.logActivity({
        title: 'Order Dispatch',
        description: `your order with the order id ${updates.orderId} is dispatched `,
        activityType: ActivityType.ORDER_DISPATCH,
        user: updates.userId,
        metadata: {
          alertLevel: AlertLevel.SUCCESS,
        },
        icon: ActivityIcon.USER_PLUS
      })
    }
    return updates;
  }

  async updateOrderTracking(
    orderId: string,
    newStatus: OrderStatus,
    description: string,
    trackingInfo?: {
      trackingNumber?: string;
      logisticWebsite?: string;
      logisticName?: string;
    },
    location?: string,
    media?: FileInfo[],
  ) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");
  
    // Ensure the status flow is valid
    if (!this.STATUS_FLOW[order.status]?.includes(newStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition from '${order.status}' → '${newStatus}'`
      );
    }
  
    const isOngoing = [OrderStatus.ONGOING, OrderStatus.SHIPPED].includes(newStatus);
 
    const event: ITrackingEvent = {
      status: newStatus === OrderStatus.ONGOING ? OrderStatus.SHIPPED : newStatus,
      description,
      location,
      media: media || [],
      timestamp: new Date(),
      meta: trackingInfo
    };

    
  
    const updatedOrder = await this.orderRepo.updateStatus(
      orderId,
      newStatus,
      event,
      {
        ...(isOngoing && trackingInfo?.trackingNumber && {
          trackingNumber: trackingInfo.trackingNumber,
        }),
        ...(isOngoing && trackingInfo?.logisticWebsite && {
          trackingUrl: trackingInfo.logisticWebsite,
        }),
        ...(isOngoing && trackingInfo?.logisticName && {
          carrier: trackingInfo.logisticName
        })
      }
    );
  
    return updatedOrder;
  }
  
}