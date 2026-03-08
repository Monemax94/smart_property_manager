import { injectable } from 'inversify';
import { PropertyModel } from '../models/Property';
import { IWishlist, IWishlistDocument, WishlistModel } from '../models/Wishlist';
import { Types } from 'mongoose';
import { ApiError } from '../utils/ApiError';

export interface IWishlistRepository {
  createWishlist(userId: Types.ObjectId): Promise<IWishlistDocument>;
  getWishlistByUser(userId: Types.ObjectId): Promise<IWishlistDocument | null>;
  addItemToWishlist(userId: Types.ObjectId, propertyId: Types.ObjectId): Promise<IWishlistDocument | null>;
  removeItemFromWishlist(userId: Types.ObjectId, propertyId: Types.ObjectId): Promise<IWishlistDocument | null>;
  clearWishlist(userId: Types.ObjectId): Promise<IWishlistDocument | null>;
}

@injectable()
export class WishlistRepository implements IWishlistRepository {
  async createWishlist(userId: Types.ObjectId): Promise<IWishlistDocument> {
    return WishlistModel.create({ user: userId, items: [] });
  }

  async getWishlistByUser(userId: Types.ObjectId): Promise<IWishlistDocument | null> {
    return WishlistModel.findOne({ user: userId })
      .populate({
        path: 'items.property',
        model: 'Property'
      });
  }

  async addItemToWishlist(userId: Types.ObjectId, propertyId: Types.ObjectId): Promise<IWishlistDocument> {
    // Check if property exists
    const property = await PropertyModel.findById(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    // Check if property is already in wishlist
    const existingWishlist = await WishlistModel.findOne({
      user: userId,
      'items.property': propertyId
    });

    if (existingWishlist) {
      throw ApiError.badRequest('Property already exists in wishlist');
    }

    const updatedWishlist = await WishlistModel.findOneAndUpdate(
      { user: userId },
      { $addToSet: { items: { property: propertyId } } },
      { new: true, upsert: true }
    ).populate('items.property');

    if (!updatedWishlist) {
      throw new Error('Failed to update wishlist');
    }

    return updatedWishlist;
  }

  async removeItemFromWishlist(userId: Types.ObjectId, propertyId: Types.ObjectId): Promise<IWishlistDocument> {
    const propertyObjectId = new Types.ObjectId(propertyId);
    const userObjectId = new Types.ObjectId(userId);

    // First check if user has a wishlist and it contains this property
    const wishlist = await WishlistModel.findOne({
      user: userObjectId,
      'items.property': propertyObjectId
    });

    if (!wishlist) {
      throw new Error('Property not found in wishlist');
    }

    const updatedWishlist = await WishlistModel.findOneAndUpdate(
      { user: userObjectId },
      { $pull: { items: { property: propertyObjectId } } },
      { new: true }
    ).populate('items.property');

    if (!updatedWishlist) {
      throw new Error('Failed to update wishlist');
    }

    return updatedWishlist;
  }

  async clearWishlist(userId: Types.ObjectId): Promise<IWishlistDocument | null> {
    return WishlistModel.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } },
      { new: true }
    );
  }
}
