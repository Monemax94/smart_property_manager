import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { AuthenticatedRequest } from '../../types/customRequest';
import { TYPES } from '../../config/types';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { VendorService } from '../../services/VendorService';
import { ApiError } from '../../utils/ApiError';
import mongoose from 'mongoose';
import { OrderTrackingService } from '../../services/OrderTrackingService';
import { OrderStatus } from '../../models/OrderModel';

@injectable()
export class VendorOrderController {
    constructor(
        @inject(TYPES.VendorService) private service: VendorService,
        @inject(TYPES.OrderTrackingService) private orderService: OrderTrackingService,

    ) { }

    /**
  * Get vendor's product orders
  */
    getVendorOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const vendorId = req.user.vendor._id;
        const pageQuery = req.query.page;
        const pageSizeQuery = req.query.limit;
        // Validate vendorId
        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json(ApiError.badRequest('Invalid vendor ID'));
        }
        const page = pageQuery ? parseInt(pageQuery as string, 10) : 1;
        const pageSize = pageSizeQuery ? parseInt(pageSizeQuery as string, 10) : 10;

        if (isNaN(page) || isNaN(pageSize)) {
            return res.status(400).json(
                ApiError.badRequest('Invalid pagination parameters. Page and pageSize must be numbers')
            );
        }
        console.log(vendorId)

        if (page < 1 || pageSize < 1 || pageSize > 100) {
            return res.status(400).json(ApiError.badRequest('Invalid pagination parameters. Page must be >=1, pageSize between 1-100'));
        }

        const result = await this.service.getVendorOrdersWithPayments(
            vendorId.toString(),
            page,
            pageSize
        );

        return res.status(200).json(ApiResponse.paginated(
            result.data,
            {
                total: result.pagination.total,
                page: result.pagination.page,
                limit: result.pagination.limit,
                pages: result.pagination.pages
            },
            'Vendor orders retrieved successfully'
        ))
    });
    /**
  * Get vendor's best selling products
  */
    getBestSelling = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const vendorId = req.user.vendor._id;
        const pageSizeQuery = req.query.limit;
   
        const limitSize = pageSizeQuery ? parseInt(pageSizeQuery as string, 10) : 10;

        if (isNaN(limitSize)) {
            return res.status(400).json(
                ApiError.badRequest('Invalid pagination parameters. Page and pageSize must be numbers')
            );
        }


        const result = await this.service.getVendorBestSellingProducts(
            vendorId.toString(),
            limitSize
        );


        return res.status(200).json(ApiResponse.success(
            result.data,
            'Vendor best selling product retrieved successfully'
        ))
    });
    updateOrderToDeleivered = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const vendorId = req.user.vendor._id;
        const orderId = req.params.orderId;
        const media = req.body.uploadedFiles || [];
        const result = await this.orderService.updateOrderTracking(
            orderId.toString(),
            OrderStatus.DELIVERED,
            'Your order has been delivered',
            {},
            'Buyer',
            media
        );
        return res.status(200).json(ApiResponse.success(
            result
        ))
    });
    updateOrderToShipped = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const orderId = req.params.orderId;
        const vendorId = req.user.vendor._id;
        const {uploadedFiles, logisticName, logisticWebsite, trackingNumber}= req.body
       
        const result = await this.orderService.updateOrderTracking(
            orderId.toString(),
            OrderStatus.ONGOING,
            'Your order has transferred to the shipping agent',
            {
                logisticName,
                logisticWebsite,
                trackingNumber,
            },
            logisticName,
            uploadedFiles
        );
        return res.status(200).json(ApiResponse.success(
            result
        ))
    });
}