import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { AuthenticatedRequest } from '../../types/customRequest';
import { Types } from 'mongoose';
import { TYPES } from '../../config/types';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { VendorService } from '../../services/VendorService';

@injectable()
export class VendorAnalyticsController {
    constructor(
        @inject(TYPES.VendorService) private service: VendorService,

    ) { }

    /**
  * Get vendor's stats
  */
    getVendorsWithSearchOptions = asyncHandler(async (
        req: AuthenticatedRequest,
        res: Response
      ) => {
        const {
          categoryIds,
          minRating,
          sortBy,
          sortOrder,
          page,
          limit,
        } = req.query;
      
        const parsedCategoryIds: string[] | undefined =
        typeof categoryIds === 'string'
          ? categoryIds.split(',')
          : Array.isArray(categoryIds)
          ? categoryIds.filter(
              (id): id is string => typeof id === 'string'
            )
          : undefined;
      
        const result = await this.service.getVendorsByCategory({
          categoryIds: parsedCategoryIds,
          minRating: minRating ? Number(minRating) : undefined,
          sortBy: sortBy as any,
          sortOrder: sortOrder as any,
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
        });
      
        return res.status(200).json(
          ApiResponse.success(result)
        );
      });
      

    getDashboardStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

        const vendorId = new Types.ObjectId(req.user.vendor._id);

        const result = await this.service.getVendorStatistics(
            vendorId
        );

        return res.status(200).json(
            ApiResponse.success(
                result
            )
        );
    });
    getDashboardStatisticsWithQueries = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const vendorId = new Types.ObjectId(req.user.vendor._id);

        const filters = {
            category: req.query.category as string,
            period: req.query.period as string,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
        };

        const result = await this.service.getVendorAnalytics(
            vendorId,
            filters
        );

        return res.status(200).json(ApiResponse.success(result));
    });

    getVendorProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

        const userId = req.user._id;
        const vendorId = req.user.vendor._id;
        const [profile, vendorStatistics] = await Promise.all([
            this.service.getVendorByUserId(userId.toString()),
            this.service.getVendorWithReviewStats(vendorId.toString()),
        ]);

        return res.status(200).json(
            ApiResponse.success(
                {
                    profile,
                    vendorStatistics
                },
                "vendor profile fetched successfully"
            )
        )
    })
}