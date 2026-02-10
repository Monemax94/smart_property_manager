import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { PlanService } from '../services/PlanService';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';

@injectable()
export class PlanController {
  constructor(
    @inject(TYPES.PlanService) private planService: PlanService
  ) {}

  getAllPlans = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const plans = await this.planService.getAllPlans();
    
    res.json(new ApiResponse(200, { plans }, 'Plans retrieved successfully'));
  });

  getPlanById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid plan ID format');
    }

    const plan = await this.planService.getPlanById(id);
    
    if (!plan) {
      throw ApiError.notFound('Plan not found');
    }
    
    res.json(new ApiResponse(200, { plan }, 'Plan retrieved successfully'));
  });

  createPlan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, price, durationInDays, features, isActive } = req.body;
    
    // Validate required fields
    if (!name || !description || price === undefined || durationInDays === undefined) {
      throw ApiError.badRequest('Name, description, price, and durationInDays are required');
    }

    if (price < 0) {
      throw ApiError.badRequest('Price cannot be negative');
    }

    if (durationInDays < 1) {
      throw ApiError.badRequest('Duration must be at least 1 day');
    }

    const plan = await this.planService.createPlan(req.body);
    
    res.status(201).json(new ApiResponse(201, { plan }, 'Plan created successfully'));
  });

  updatePlan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid plan ID format');
    }

    // Validate that update data is provided
    if (Object.keys(req.body).length === 0) {
      throw ApiError.badRequest('Update data is required');
    }

    // Validate price if provided
    if (req.body.price !== undefined && req.body.price < 0) {
      throw ApiError.badRequest('Price cannot be negative');
    }

    // Validate duration if provided
    if (req.body.durationInDays !== undefined && req.body.durationInDays < 1) {
      throw ApiError.badRequest('Duration must be at least 1 day');
    }

    const updatedPlan = await this.planService.updatePlan(id, req.body);
    
    if (!updatedPlan) {
      throw ApiError.notFound('Plan not found');
    }
    
    res.json(new ApiResponse(200, { updatedPlan }, 'Plan updated successfully'));
  });

  deletePlan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid plan ID format');
    }

    const deletedPlan = await this.planService.deletePlan(id);
    
    if (!deletedPlan) {
      throw ApiError.notFound('Plan not found');
    }
    
    res.json(new ApiResponse(200, null, 'Plan deleted successfully'));
  });
}