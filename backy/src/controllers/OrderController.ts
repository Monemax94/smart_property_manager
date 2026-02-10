import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { OrderService } from '../services/OrderService';
import { AuthenticatedRequest } from '../types/customRequest';
import { Types } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../models/User';
import { DeliveryStatus, OrderStatus } from '../models/OrderModel';

@injectable()
export class OrderController {
  constructor(
    @inject(TYPES.OrderService) private orderService: OrderService
  ) { }

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;
    const { addressId } = req.body;
    
    if (!addressId) {
      return res.status(400).json(ApiError.badRequest('Address ID is required for the order'));
    }

    if (!Types.ObjectId.isValid(addressId)) {
      return res.status(400).json( ApiError.badRequest('Invalid address ID format'));
    }

    const order = await this.orderService.create(userId.toString(), addressId);
    
    res.status(201).json(new ApiResponse(201, order, 'Order created successfully'));
  });

  findUserOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json( ApiError.badRequest('Page must be at least 1'));
    }
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json( ApiError.badRequest('Limit must be between 1 and 100'));
    }

    // You can add more filters here as needed
    const filters: Record<string, any> = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if(req.user.role !== UserRole.CUSTOMER){
      userId = null
    }
    const orders = await this.orderService.findAll(userId, page, limit, filters);
    const orderStatistics = await this.orderService.getOrderStatistics(userId?.toString());
    
    res.json(new ApiResponse(200, { orders, orderStatistics }, 'User orders retrieved successfully'));
  });
  
  findAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json( ApiError.badRequest('Page must be at least 1'));
    }
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json( ApiError.badRequest('Limit must be between 1 and 100'));
    }

    // You can add more filters here as needed
    const filters: Record<string, any> = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }

    const orders = await this.orderService.findAll(null, page, limit, filters);
    const orderStatistics = await this.orderService.getOrderStatistics();
    
    res.json(new ApiResponse(200, { orders, orderStatistics }, 'All orders retrieved successfully'));
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json( ApiError.badRequest('Invalid order ID format'));
    }

    const order = await this.orderService.findById(id);
    
    if (!order) {
      return res.status(404).json( ApiError.notFound('Order not found'));
    }
    
    res.json(new ApiResponse(200, order, 'Order retrieved successfully'));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json( ApiError.badRequest('Invalid order ID format'));
    }

    const order = await this.orderService.update(id, req.body);
    
    res.json(new ApiResponse(200, order, 'Order updated successfully'));
  });

   confirmOrderDelivered = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const { orderId } = req.params;

    // load populated order
    const order = await this.orderService.findById(orderId);

    if (!order) {
      return res.status(404).json(ApiError.notFound("Order not found"));
    }

    // update status
    order.status = OrderStatus.CONFIRMED;
    order.deliveryStatus = DeliveryStatus.Delivered;
    // save and await it
    await order.save();

    return res.status(200).json(ApiResponse.success(order));
  });
  

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json( ApiError.badRequest('Invalid order ID format'));
    }

    const deleted = await this.orderService.delete(id);
    
    if (!deleted) {
      return res.status(400).json(ApiError.notFound('Order not found'));
    }
    
    res.json(new ApiResponse(200, { deleted }, 'Order deleted successfully'));
  });
}