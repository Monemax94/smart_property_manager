import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { ProductService } from '../../services/ProductService';
import { AuthenticatedRequest } from '../../types/customRequest';
import mongoose, { Types } from 'mongoose';
import { TYPES } from '../../config/types';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { AvailabilityRequestStatus } from '../../models/Product';
import { ProductVendorQueryOptions } from '../../interfaces/IProductRepository';
import { ApiError } from '../../utils/ApiError';
import { CategoryService } from '../../services/CategoryService';
import { AvailabilityRequestModel } from '../../models/ProductAvailability';

@injectable()
export class VendorProductController {
  constructor(
    @inject(TYPES.ProductService) private service: ProductService,
    @inject(TYPES.CategoryService) private categoryService: CategoryService,

  ) { }

  /**
* Get vendor's product requests
*/
  getVendorProductRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vendorId = new Types.ObjectId(req.user.vendor._id);
    const {
      search,
      status,
      productType,
      page = '1',
      limit = '10',
      startDate,
      endDate
    } = req.query;

    const result = await this.service.getVendorProductRequests(
      vendorId,
      {
        search: search as string,
        status: status as string || AvailabilityRequestStatus.PENDING,
        productType: productType as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        startDate: startDate as string,
        endDate: endDate as string
      }
    );

    return res.status(200).json(
      ApiResponse.success(
        {
          requests: result.data,
          pagination: result.pagination
        },
        'Vendor product requests retrieved successfully'
      )
    );
  });

  verifyAvailabilityRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { productId, requestId } = req.params;
    const { status, verificationNotes, priceQuoted, estimatedDelivery, shippingFee } = req.body;
    const verifiedBy = req.user._id;

    if (!Object.values(AvailabilityRequestStatus).includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await this.service.verifyAvailabilityAndAddToCart(productId, requestId, {
      status,
      verifiedBy,
      verificationNotes,
      priceQuoted,
      estimatedDelivery,
      shippingFee
    });

    return res.status(200).json(
      ApiResponse.success(result)
    );
  });

  rejectAvailabilityRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { productId, requestId } = req.params;
    const result = await this.service.rejectAvailabilityRequest(productId, requestId);
    return res.status(200).json(
      ApiResponse.success(result)
    );
  });

  getVendorProductById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const productId = req.params.id;
    // Validate vendorId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json(ApiError.badRequest('Invalid vendor ID'));
    }

    const result = await this.service.getProductByIdWithStats(productId.toString());

    return res.status(200).json(ApiResponse.success(
      result,
      'Vendor product retrieved successfully'
    ));
  })

  getVendorProductsCategoriesCounts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vendorId = req.user.vendor._id;
    // Validate vendorId
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json(ApiError.badRequest('Invalid vendor ID'));
    }

    const result = await this.categoryService.getCategoryProductCount(vendorId.toString());

    return res.status(200).json(ApiResponse.success(
      result,
      ' data retrieved successfully'
    ));
  })
  getVendorProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vendorId = req.user.vendor._id;
    // Validate vendorId
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json(ApiError.badRequest('Invalid vendor ID'));
    }
    const {
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      inStock,
      category,
      search,
      sortBy,
      sortOrder = 'desc'
    } = req.query;

    const options: ProductVendorQueryOptions = {
      page: Number(page),
      limit: Number(limit),
      ...(minPrice && { minPrice: Number(minPrice) }),
      ...(maxPrice && { maxPrice: Number(maxPrice) }),
      ...(inStock && { inStock: inStock === 'true' }),
      ...(category && { category: new Types.ObjectId(category as string) }),
      ...(search && { searchTerm: search as string }),
      ...(sortBy && {
        sort: {
          [sortBy as string]: sortOrder === 'desc' ? -1 : 1
        }
      })
    };

    const result = await this.service.findByVendor(vendorId.toString(), options);

    return res.status(200).json(ApiResponse.paginated(
      result.products,
      {
        total: result.total,
        page: result.page,
        // limit: result.limit,
        pages: result.pages
      },
      'Vendor products retrieved successfully'
    ));
  });
  // Publish product
  publishProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { productId } = req.params;
    const userRole = req.user.role;
    const vendorId = req.user.vendor._id;
    const updatedProduct = await this.service.togglePublishStatus(
      productId,
      vendorId.toString(),
      userRole,
      true
    );
    return res.status(200).json(
      ApiResponse.success(
        updatedProduct,
        'Product published successfully'
      )
    );

  })

  // Unpublish product
  unpublishProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { productId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const updatedProduct = await this.service.togglePublishStatus(
      productId,
      userId,
      userRole,
      false
    );

    return res.status(200).json(
      ApiResponse.success(
        updatedProduct, 'Product unpublished successfully'
      )
    );
  })
}