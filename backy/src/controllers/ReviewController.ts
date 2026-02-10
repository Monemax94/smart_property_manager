import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { ReviewService } from '../services/ReviewService';
import { TYPES } from '../config/types';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import mongoose, { Types } from 'mongoose';
import { FollowedVendorsResponse } from "../interfaces/IVendorRepository"
import { FileInfo } from '../models/File';
import loggers from '../utils/loggers';
@injectable()
export class ReviewController {
    constructor(
        @inject(TYPES.ReviewService) private service: ReviewService,
     
    ) { }

    createReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user._id;
        const uploadedFiles = req.body.uploadedFiles || [];

        // Get variant images from uploaded files
        const images = uploadedFiles.filter((file: any) =>
            file.fileType === 'image'
        );

        const review = await this.service.createReview({ ...req.body, images, userId });
        return res.status(201).json(ApiResponse.created(review, 'Review created successfully'));
    });
    createBulk = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user._id.toString();
        const reviews = req.body.reviews as any[];
        const uploadedFiles = req.body.uploadedFiles || [];
      
        // Group images by productId + extension
        const imagesByProductId = new Map<string, FileInfo[]>();
     
      
        for (const file of uploadedFiles) {
          // Extract productId and extension from imageName
          const { imageName } = file; // e.g., "64f8b3c9e1234567890abcd1.jpg"
          if (!imageName) continue;
      
          const lastDot = imageName.lastIndexOf(".");
          if (lastDot === -1) continue; // skip if no extension
      
          const baseName = imageName.substring(0, lastDot); // "64f8b3c9e1234567890abcd1"
          const extension = imageName.substring(lastDot + 1); // "jpg"
      
          if (!imagesByProductId.has(baseName)) {
            imagesByProductId.set(baseName, []);
          }
      
          // You can optionally store the extension in the FileInfo object
          imagesByProductId.get(baseName)!.push({ ...file, extension });
        }
      
        // Attach images to their corresponding reviews
        const enrichedReviews = reviews.map(review => ({
          ...review,
          images: imagesByProductId.get(review.productId) || []
        }));
      
        // Pass enriched payload to service
        const result = await this.productService.submitBulkReviews(enrichedReviews, userId);
      
        return res.status(201).json(
          ApiResponse.success(result, "Bulk review processing completed")
        );
      });
      
      
    getVendorReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { vendorId } = req.params;

        if (!Types.ObjectId.isValid(vendorId)) {
            throw ApiError.badRequest('Invalid vendor ID format');
        }

        const reviews = await this.service.getVendorReviews(vendorId);

        res.json(new ApiResponse(200, { reviews }, 'Vendor reviews retrieved successfully'));
    });
    getBuyersReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { buyerId } = req.params;

        if (!Types.ObjectId.isValid(buyerId)) {
            throw ApiError.badRequest('Invalid vendor ID format');
        }

        const reviews = await this.service.findBuyersReviews(buyerId);

        res.json(new ApiResponse(200, { reviews }, 'buyer reviews retrieved successfully'));
    });

    getProductReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { productId } = req.params;

        if (!Types.ObjectId.isValid(productId)) {
            throw ApiError.badRequest('Invalid product ID format');
        }

        const reviews = await this.service.getProductReviews(productId);

        res.json(new ApiResponse(200, { reviews }, 'Product reviews retrieved successfully'));
    });

    getUserReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user._id;
        const reviews = await this.service.getUsersReviews(userId.toString());
        res.json(new ApiResponse(200, { reviews }, 'Product reviews retrieved successfully'));
    });

    likeReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const { reviewId } = req.params;

        if (!Types.ObjectId.isValid(reviewId)) {
            throw ApiError.badRequest('Invalid review ID format');
        }

        const existingReview = await this.service.checkSpecificUserReview(reviewId, userId);

        if (existingReview?.likes.includes(userId)) {
            throw ApiError.badRequest("You've already liked this review");
        }

        const review = await this.service.likeReview(reviewId, userId);

        res.json(new ApiResponse(200, { review }, 'Review liked successfully'));
    });

    dislikeReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const { reviewId } = req.params;

        if (!Types.ObjectId.isValid(reviewId)) {
            throw ApiError.badRequest('Invalid review ID format');
        }

        const existingReview = await this.service.checkSpecificUserReview(reviewId, userId);

        if (existingReview?.dislikes.includes(userId)) {
            throw ApiError.badRequest("You've already disliked this review");
        }

        const review = await this.service.dislikeReview(reviewId, userId);

        res.json(new ApiResponse(200, { review }, 'Review disliked successfully'));
    });

    removeReaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { reviewId } = req.params;
        const userId = req.user._id;

        if (!Types.ObjectId.isValid(reviewId)) {
            throw ApiError.badRequest('Invalid review ID format');
        }

        const review = await this.service.removeReaction(reviewId, userId);

        res.json(new ApiResponse(200, { review }, 'Reaction removed successfully'));
    });


}