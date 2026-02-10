import { inject } from 'inversify';
import { Request, Response } from 'express';
import { IActivityLogService } from '../services/ActivityLogService';
import { TYPES } from '../config/types';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class ActivityLogController {
  constructor(
    @inject(TYPES.ActivityLogService) 
    private service: IActivityLogService
  ) {}

  getVendorActivities = asyncHandler(async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    
    if (!vendorId) {
      return res.status(400).json( ApiError.badRequest('Vendor ID is required'));
    }

    const activities = await this.service.getVendorActivities(vendorId);
    
    res.json(new ApiResponse(200, activities, 'Vendor activities retrieved successfully'));
  });

  getUserActivities = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json( ApiError.badRequest('User ID is required'));
    }

    const activities = await this.service.getUserActivities(userId);
    
    res.json(new ApiResponse(200, activities, 'User activities retrieved successfully'));
  });

  getSystemAlerts = asyncHandler(async (req: Request, res: Response) => {
    const alerts = await this.service.getSystemAlerts();
    
    res.json(new ApiResponse(200, alerts, 'System alerts retrieved successfully'));
  });
}