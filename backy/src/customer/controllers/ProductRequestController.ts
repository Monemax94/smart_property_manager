import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../types/customRequest';
import { TYPES } from '../../config/types';
import { OrderRequestService } from '../../services/OrderRequestService';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { ApiResponse } from '../../utils/ApiResponse';
import { ProductService } from '../../services/ProductService';
import { AvailabilityRequestStatus } from '../../models/Product';


@injectable()
export class ProductRequestController {
  constructor(
    @inject(TYPES.OrderRequestService) private service: OrderRequestService,
    @inject(TYPES.ProductService) private productService: ProductService
  ) { }


  createRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const customerId = req.user._id;
    const { name, description, category, quantity, budget, deadline, specifications } = req.body;
    const uploadedFiles = req.body.uploadedFiles || [];

    // Separate main images from variant images
    const mainImages = uploadedFiles.filter((file: any) =>
      !file.isVariantImage && file.fileType === 'image'
    );

    const request = await this.service.createRequest({
      customerId,
      name,
      description,
      category,
      quantity,
      budget,
      deadline,
      referenceImages: mainImages,
      specifications
    });

    return res.status(201).json(
      new ApiResponse(201, request, 'Custom product request created successfully')
    );
  });

  getRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const request = await this.service.getRequestById(id);

    if (!request) {
      throw ApiError.notFound('Custom product request not found');
    }

    res.json(new ApiResponse(200, request, 'Request retrieved successfully'));
  });

  getCustomerRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { customerId } = req.params;
    const requests = await this.service.getCustomerRequests(customerId);

    res.json(new ApiResponse(200, requests, 'Customer requests retrieved successfully'));
  });


  getActiveRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id
    const requests = await this.productService.getCustomerRequests(userId.toString(), [
      AvailabilityRequestStatus.PENDING,
      AvailabilityRequestStatus.REJECTED,
      AvailabilityRequestStatus.OUT_OF_STOCK
    ]);
    res.json(new ApiResponse(200, requests, 'Active requests retrieved successfully'));
  });

  addVendorOffer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { requestId } = req.params;
    const { vendorId, price, estimatedDelivery, notes } = req.body;

    const updatedRequest = await this.service.addVendorOffer(
      requestId,
      vendorId,
      { price, estimatedDelivery, notes }
    );

    if (!updatedRequest) {
      throw ApiError.notFound('Request not found');
    }

    res.json(new ApiResponse(200, updatedRequest, 'Vendor offer added successfully'));
  });

  acceptOffer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { requestId, offerId } = req.params;

    const updatedRequest = await this.service.acceptVendorOffer(requestId, offerId);

    if (!updatedRequest) {
      throw ApiError.notFound('Request or offer not found');
    }

    res.json(new ApiResponse(200, updatedRequest, 'Offer accepted successfully'));
  });

  placeOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { requestId } = req.params;

    const updatedRequest = await this.service.placeOrder(requestId);

    if (!updatedRequest) {
      throw ApiError.notFound('Request not found');
    }

    res.json(new ApiResponse(200, updatedRequest, 'Order placed successfully'));
  });
}