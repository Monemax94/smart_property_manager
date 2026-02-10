import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { OrderTrackingService } from '../services/OrderTrackingService';
import { TYPES } from '../config/types';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';
import { OrderStatus } from '../models/OrderModel';

@injectable()
export class OrderTrackingController {
  constructor(
    @inject(TYPES.OrderTrackingService) private trackingService: OrderTrackingService
  ) {}

  startTracking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderId } = req.params;
    const { _id: userId, role } = req.user;

    if (!Types.ObjectId.isValid(orderId)) {
      throw ApiError.badRequest('Invalid order ID format');
    }

    const order = await this.trackingService.startTracking(orderId, userId.toString(), role);
    
    res.json(new ApiResponse(200, order, 'Order tracking started successfully'));
  });

  getTrackingInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderId } = req.params;

    if (!Types.ObjectId.isValid(orderId)) {
      throw ApiError.badRequest('Invalid order ID format');
    }

    const trackingInfo = await this.trackingService.getTrackingInfo(orderId);
    
    res.json(new ApiResponse(200, trackingInfo, 'Tracking information retrieved successfully'));
  });
}