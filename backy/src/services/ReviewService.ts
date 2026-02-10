import { inject, injectable } from 'inversify';
import {Types} from "mongoose"
import { IReview, IReviewDocument, IReviewRepository, ReviewRating } from '../interfaces/IReviewRepository';
import { TYPES } from '../config/types';

@injectable()
export class ReviewService {
    constructor(
        @inject(TYPES.ReviewRepository) private repository: IReviewRepository
    ) {}

    async createReview(reviewData: IReview): Promise<IReviewDocument> {
        return this.repository.create(reviewData);
    }

    async getVendorReviews(vendorId: string): Promise<IReviewDocument[]> {
        return this.repository.findByVendor(vendorId);
    }
    async findBuyersReviews(buyerId: string): Promise<IReviewDocument[]> {
        return this.repository.findBuyersReviews(buyerId);
    }
    async checkSpecificUserReview(reviewId: string, userId: string): Promise<IReviewDocument> {
        return this.repository.checkSpecificUserReview(reviewId, userId);
    }

    async getProductReviews(productId: string): Promise<IReviewDocument[]> {
        return this.repository.findByProduct(productId);
    }
    async getUsersReviews(productId: string): Promise<IReviewDocument[]> {
        return this.repository.findByUser(productId);
    }

    async likeReview(reviewId: string, userId: Types.ObjectId): Promise<IReviewDocument | null> {
        return this.repository.likeReview(reviewId, userId);
    }

    async dislikeReview(reviewId: string, userId: Types.ObjectId): Promise<IReviewDocument | null> {
        return this.repository.dislikeReview(reviewId, userId);
    }

    async removeReaction(reviewId: string, userId: Types.ObjectId): Promise<IReviewDocument | null> {
        return this.repository.removeLikeOrDislike(reviewId, userId);
    }
    async getVendorProductReviewStats(vendorId: string) {
        return this.repository.getVendorCumulativeRatings(vendorId);
    }
}