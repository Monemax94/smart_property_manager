import { Schema, model } from 'mongoose';
import { IReviewDocument } from '../interfaces/IReviewRepository';
import { FileInfoSchema } from './File';

export const reviewSchema = new Schema<IReviewDocument>({
    // customers who reviews
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    propertyId: {
        type: Schema.Types.ObjectId,
        ref: 'Property'
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
    },
    rating: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5]
    },
    vendorRating: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5]
    },
    comment: {
        type: String,
        required: true
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    images: { type: [FileInfoSchema], default: [] },
    dislikes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

export const ReviewModel = model<IReviewDocument>('Review', reviewSchema);