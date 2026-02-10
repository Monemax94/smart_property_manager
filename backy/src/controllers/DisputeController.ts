import { Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../config/types";
import { AuthenticatedRequest } from '../types/customRequest';
import { DisputeService } from "../services/DisputeService";
import { OrderService } from "../services/OrderService";
import { ActivityLogService } from "../services/ActivityLogService";
import { ActivityType, AlertLevel } from "../models/ActivityLog";
import { Types } from "mongoose";
import { UserRole } from "../models/User";
import { DisputeStatus } from "../models/Dispute";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";

@injectable()
export class DisputeController {
  constructor(
    @inject(TYPES.DisputeService) private disputeService: DisputeService,
    @inject(TYPES.ActivityLogService) private activityService: ActivityLogService,
    @inject(TYPES.OrderService) private orderService: OrderService
  ) { }

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const raisedBy = req.user._id;
    
    if (req.user.role !== UserRole.CUSTOMER) {
      throw ApiError.forbidden("Only customers can create disputes");
    }

    const uploadedFilex = req.body.uploadedFiles || [];
    const { order, uploadedFiles, ...data } = req.body;
    
    // Check for order existence
    const orderExist = await this.orderService.findById(order);
    if (!orderExist) {
      throw ApiError.notFound("Order not found");
    }

    const dispute = await this.disputeService.createDispute({ 
      ...data, 
      raisedBy, 
      attachments: uploadedFilex, 
      order 
    });
    
    if (!dispute) {
      throw ApiError.internal("Dispute creation failed");
    }

    await this.activityService.logActivity({
      title: 'New Dispute Filed',
      description: `${dispute.description}`,
      activityType: ActivityType.DISPUTE_OPENED,
      user: req.user?._id,
      metadata: {
        disputeId: new Types.ObjectId(dispute?._id.toString()),
        alertLevel: AlertLevel.CRITICAL,
      }
    });

    res.status(201).json(new ApiResponse(201, { dispute }, "Dispute created successfully"));
  });

  getOne = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const dispute = await this.disputeService.getDispute(req.params.id);
    
    if (!dispute) {
      throw ApiError.notFound("Dispute not found");
    }
    
    res.json(new ApiResponse(200, dispute, "Dispute retrieved successfully"));
  });

  getCurrentUserDisputes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;

    const {
      page = '1',
      limit = '10',
      status,
      type,
      q
    } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    if (pageNum < 1) {
      throw ApiError.badRequest("Page must be at least 1");
    }
    
    if (limitNum < 1 || limitNum > 100) {
      throw ApiError.badRequest("Limit must be between 1 and 100");
    }

    const disputes = await this.disputeService.listDisputes(userId.toString(), {
      page: pageNum,
      limit: limitNum,
      status: status as DisputeStatus,
      type: type as string,
      query: q as string
    });
    
    res.json(new ApiResponse(200, disputes, "User disputes retrieved successfully"));
  });

  updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const disputeId = req.params.id; 
    const { status } = req.body;
    
    if (!status) {
      throw ApiError.badRequest("Status is required");
    }

    const dispute = await this.disputeService.getDispute(disputeId);
    if (!dispute) {
      throw ApiError.notFound("Dispute not found");
    }

    const updated = await this.disputeService.updateDisputeStatus(disputeId, status);
    
    res.json(new ApiResponse(200, updated, "Dispute status updated successfully"));
  });

  respond = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const responder = req.user._id;
    const disputeId = req.params.id; 
    
    const dispute = await this.disputeService.getDispute(disputeId);
    if (!dispute) {
      throw ApiError.notFound("Dispute not found");
    }

    const response = await this.disputeService.respondToDispute(disputeId, { ...req.body, responder });
    
    res.json(new ApiResponse(200, response, "Response added to dispute successfully"));
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const disputeId = req.params.id; 
    
    const dispute = await this.disputeService.getDispute(disputeId);
    if (!dispute) {
      throw ApiError.notFound("Dispute not found");
    }

    const deleted = await this.disputeService.deleteDispute(disputeId);
    if (!deleted) {
      throw ApiError.internal("Failed to delete dispute");
    }
    
    res.json(new ApiResponse(200, deleted, "Dispute deleted successfully"));
  });
}