import { inject, injectable } from 'inversify';
import { IWishlistRepository } from '../repositories/WishlistRepository';
import { IWishlistDocument } from '../models/Wishlist';
import { Types } from 'mongoose';
import { TYPES } from '../config/types';

export interface IWishlistService {
  getWishlist(userId: Types.ObjectId): Promise<IWishlistDocument>;
  addToWishlist(userId: Types.ObjectId, propertId: Types.ObjectId): Promise<IWishlistDocument>;
  removeFromWishlist(userId: Types.ObjectId, propertId: Types.ObjectId): Promise<IWishlistDocument>;
  clearWishlist(userId: Types.ObjectId): Promise<IWishlistDocument>;
}
@injectable()
export class WishlistService implements IWishlistService {
  constructor(
    @inject(TYPES.WishlistRepository) private wishlistRepository: IWishlistRepository
  ) {}

  async getWishlist(userId: Types.ObjectId): Promise<IWishlistDocument> {
    let wishlist = await this.wishlistRepository.getWishlistByUser(userId);
    if (!wishlist) {
      wishlist = await this.wishlistRepository.createWishlist(userId);
    }
    return wishlist;
  }

  async addToWishlist(userId: Types.ObjectId, propertId: Types.ObjectId): Promise<IWishlistDocument> {
    try {
      return await this.wishlistRepository.addItemToWishlist(userId, propertId);
    } catch (error) {
      if (error.message === 'Property already exists in wishlist') {
        // Return existing wishlist if product already exists
        return this.getWishlist(userId);
      }
      throw error;
    }
  }

  async removeFromWishlist(userId: Types.ObjectId, propertId: Types.ObjectId): Promise<IWishlistDocument> {
    try {
      return await this.wishlistRepository.removeItemFromWishlist(userId, propertId);
    } catch (error) {
      if (error.message === 'Property not found in wishlist') {
        // Return current wishlist if product wasn't found
        return this.getWishlist(userId);
      }
      throw error;
    }
  }

  async clearWishlist(userId: Types.ObjectId): Promise<IWishlistDocument> {
    const wishlist = await this.wishlistRepository.clearWishlist(userId);
    if (!wishlist) {
      throw new Error('Failed to clear wishlist');
    }
    return wishlist;
  }
}