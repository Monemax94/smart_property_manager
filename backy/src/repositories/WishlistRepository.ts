import { injectable } from 'inversify';
import { PropertyModel } from '../models/Property';
import { IWishlist, IWishlistDocument, WishlistModel } from '../models/Wishlist';
import { Types } from 'mongoose';
import { ApiError } from '../utils/ApiError';

export interface IWishlistRepository {
  createWishlist(userId: Types.ObjectId): Promise<IWishlistDocument>;
  getWishlistByUser(userId: Types.ObjectId): Promise<IWishlistDocument | null>;
  addItemToWishlist(userId: Types.ObjectId, productId: Types.ObjectId): Promise<IWishlistDocument | null>;
  removeItemFromWishlist(userId: Types.ObjectId, productId: Types.ObjectId): Promise<IWishlistDocument | null>;
  clearWishlist(userId: Types.ObjectId): Promise<IWishlistDocument | null>;
}
@injectable()
export class WishlistRepository implements IWishlistRepository {
  async createWishlist(userId: Types.ObjectId): Promise<IWishlistDocument> {
    return WishlistModel.create({ user: userId, items: [] });
  }

  // async getWishlistByUser(userId: Types.ObjectId): Promise<IWishlistDocument | null> {
  //   return WishlistModel.findOne({ user: userId }).populate('items.product');
  // }

  async getWishlistByUser(userId: Types.ObjectId): Promise<IWishlistDocument | null> {
    return WishlistModel.findOne({ user: userId })
      .populate({
        path: 'items.product',
        populate: [
          {
            path: 'category',
            model: 'Category'
          },
          {
            path: 'vendorId',
            model: 'Vendor',
            select: 'name logo email phone address'
          }
        ]
      });
  }


  async addItemToWishlist(userId: Types.ObjectId, propsId: Types.ObjectId): Promise<IWishlistDocument> {
    // Check if product exists
    const props = await PropertyModel.findById(propsId);
    if (!props) {
      throw new Error('Property not found');
    }

    // Check if product is already in wishlist
    const existingWishlist = await WishlistModel.findOne({
      user: userId,
      'items.property': propsId
    });

    if (existingWishlist) {
      throw ApiError.badRequest('Product already exists in wishlist');
    }

    const updatedWishlist = await WishlistModel.findOneAndUpdate(
      { user: userId },
      { $addToSet: { items: { property: propsId } } },
      { new: true, upsert: true }
    ).populate('items.property');

    if (!updatedWishlist) {
      throw new Error('Failed to update wishlist');
    }

    return updatedWishlist;
  }

  async removeItemFromWishlist(userId: Types.ObjectId, productId: Types.ObjectId): Promise<IWishlistDocument> {
    const productObjectId = new Types.ObjectId(productId);
    const userObjectId = new Types.ObjectId(userId);

    // First find the item's position
    const wishlist = await WishlistModel.findOne({
      user: userObjectId,
      'items.product': productObjectId
    });

    if (!wishlist) {
      throw new Error('Product not found in wishlist');
    }

    // Use arrayFilters for more precise removal
    const updatedWishlist = await WishlistModel.findOneAndUpdate(
      { user: userObjectId },
      { $pull: { items: { product: productObjectId } } },
      { new: true }
    ).populate('items.product');

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
