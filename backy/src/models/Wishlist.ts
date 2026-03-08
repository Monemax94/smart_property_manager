import { Schema, model, Document, Types } from 'mongoose';

export interface IWishlistItem {
  property: Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist {
  user: Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWishlistDocument extends IWishlist, Document { }

const wishlistItemSchema = new Schema<IWishlistItem>({
  property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const wishlistSchema = new Schema<IWishlistDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [wishlistItemSchema]
}, { timestamps: true });

// Indexes
wishlistSchema.index({ 'items.property': 1 });

export const WishlistModel = model<IWishlistDocument>('Wishlist', wishlistSchema);