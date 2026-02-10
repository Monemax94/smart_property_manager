import { inject, injectable } from 'inversify';
import { Response } from 'express';
import { OrderService } from '../../services/OrderService';
import { AuthenticatedRequest } from '../../types/customRequest';
import { TYPES } from '../../config/types';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { Types } from 'mongoose';
import { OrderStatus } from '../../models/OrderModel';

@injectable()
export class OrderController {
  constructor(
    @inject(TYPES.OrderService) private orderService: OrderService
  ) { }

  getOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1) {
      throw ApiError.badRequest('Page must be at least 1');
    }

    if (limit < 1 || limit > 100) {
      throw ApiError.badRequest('Limit must be between 1 and 100');
    }

    // You can add more filters here as needed
    const filters: Record<string, any> = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }

    const orders = await this.orderService.findAll(userId, page, limit, filters);
    const orderStatistics = await this.orderService.getOrderStatistics(userId.toString());

    res.json(new ApiResponse(200, { orders, orderStatistics }, 'Orders retrieved successfully'));
  });

  // Additional methods example:
  getOrderById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;
    const { orderId } = req.params;

    if (!Types.ObjectId.isValid(orderId)) {
      throw ApiError.badRequest('Invalid order ID');
    }

    const order = await this.orderService.findById(orderId);

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    res.json(new ApiResponse(200, order, 'Order retrieved successfully'));
  });


}