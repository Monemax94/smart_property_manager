import { Document } from 'mongoose';
import { Types } from 'mongoose';
import { FileInfo } from '../models/File';

export enum ReviewRating {
    TERRIBLE = 1,
    DISAPPOINTING = 2,
    OKAY = 3,
    GOOD = 4,
    EXCELLENT = 5
}

export interface IReview {
    userId: Types.ObjectId;
    propertyId?: Types.ObjectId;
    orderId?: Types.ObjectId;
    rating: ReviewRating;
    vendorRating: ReviewRating;
    comment: string;
    likes: Types.ObjectId[];
    dislikes: Types.ObjectId[];
    images: FileInfo[];
    createdAt?: Date;
    updatedAt?: Date
}

export interface IReviewDocument extends IReview, Document {}

export interface IReviewRepository {
    create(review: IReview): Promise<IReviewDocument>;
    findByVendor(vendorId: string): Promise<IReviewDocument[]>;
    findByUser(userId: string): Promise<IReviewDocument[]>;
    checkSpecificUserReview(reviewId: string, userId: string): Promise<IReviewDocument>;
    findByProduct(propertyId: string): Promise<IReviewDocument[]>;
    likeReview(reviewId: string, userId: Types.ObjectId): Promise<IReviewDocument | null>;
    dislikeReview(reviewId: string, userId: Types.ObjectId): Promise<IReviewDocument | null>;
    removeLikeOrDislike(reviewId: string, userId: Types.ObjectId): Promise<IReviewDocument | null>;
    getVendorCumulativeRatings(vendorId: string);
    findBuyersReviews(buyerId: string): Promise<IReviewDocument[]> 
}