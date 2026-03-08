import { inject, injectable } from 'inversify';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/customRequest';
import { IWishlistService } from '../services/WishlistService';
import { Types } from 'mongoose';
import { TYPES } from '../config/types';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

@injectable()
export class WishlistController {
  constructor(
    @inject(TYPES.WishlistService) private wishlistService: IWishlistService
  ) { }

  getWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    /* #swagger.tags = ['Wishlist'] */
    /* #swagger.summary = 'Retrieve current user wishlist' */

    const userId = new Types.ObjectId(req.user._id);
    const wishlist = await this.wishlistService.getWishlist(userId);

    res.json(new ApiResponse(200, wishlist, 'Wishlist retrieved successfully'));
  });

  addToWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    /* #swagger.tags = ['Wishlist'] */
    /* #swagger.summary = 'Add property to wishlist' */

    const userId = new Types.ObjectId(req.user._id);
    const propertyId = new Types.ObjectId(req.params.propertyId);
    const wishlist = await this.wishlistService.addToWishlist(userId, propertyId);
    return res.status(200).json(ApiResponse.success(wishlist, 'Property added to wishlist successfully'));
  });

  removeFromWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = new Types.ObjectId(req.user._id);
    const propertyId = new Types.ObjectId(req.params.propertyId);
    const wishlist = await this.wishlistService.removeFromWishlist(userId, propertyId);
    res.json(new ApiResponse(200, wishlist, 'Property removed from wishlist successfully'));
  });

  clearWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = new Types.ObjectId(req.user._id);
    const wishlist = await this.wishlistService.clearWishlist(userId);
    return res.json(new ApiResponse(200, wishlist, 'Wishlist cleared successfully'));
  });
}