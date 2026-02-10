import { Router } from 'express';
import { container } from '../config/inversify.config';
import { ReviewController } from '../controllers/ReviewController';
import { TYPES } from '../config/types';
import { authenticate } from "../middleware/authMiddleware";
import { validateBody } from '../middleware/bodyValidate';
import { bulkReviewSchema, reviewValidationSchema } from '../validations/reviewValidation';
import { uploadToCloudinary } from '../middleware/cloudinaryUploads';
import { upload } from '../config/multer.config';
import { FlaggingSchema } from '../validations/userValidations';


class ReviewRoutes {
  private router: Router;
  private controller: ReviewController;

  constructor() {
    this.router = Router();
    this.controller = container.get<ReviewController>(TYPES.ReviewController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/', authenticate,
      upload.array('files', 5),
      uploadToCloudinary,
      validateBody(reviewValidationSchema), this.controller.createReview);
    // this.router.post('/bulk-reviews', authenticate,
    //   upload.array('files', 20),
    //   uploadToCloudinary,
    //   validateBody(bulkReviewSchema), this.controller.createBulk);
    this.router.post(
      '/bulk-reviews',
      authenticate,
      upload.array('files', 20),
      uploadToCloudinary,
      (req, res, next) => {
        if (req.body.reviews && typeof req.body.reviews === 'string') {
          try {
            req.body.reviews = JSON.parse(req.body.reviews);
          } catch (err) {
            return res.status(400).json({ message: 'Invalid JSON for reviews' });
          }
        }
        next();
      },
      validateBody(bulkReviewSchema),
      this.controller.createBulk
    );

    this.router.get('/vendor/:vendorId', authenticate, this.controller.getVendorReviews);
    this.router.get('/vendor-followed', authenticate, this.controller.getMyFollowedVendors);
    this.router.patch('/vendor-follow/:vendorId', authenticate, this.controller.followVendor);
    this.router.patch('/vendor-unfollow/:vendorId', authenticate, this.controller.unfollowVendor);
    this.router.get('/vendor-products-ratings/:vendorId', authenticate, this.controller.getVendorProductReviewStatsRating);
    this.router.get('/product/:productId', authenticate, this.controller.getProductReviews);
    this.router.get('/users-review', authenticate, this.controller.getUserReviews);
    this.router.get('/buyers-review/:buyerId', authenticate, this.controller.getBuyersReviews);
    this.router.post('/:reviewId/like', authenticate, this.controller.likeReview);
    this.router.post('/:reviewId/dislike', authenticate, this.controller.dislikeReview);
    this.router.delete('/:reviewId/reaction', authenticate, this.controller.removeReaction);

    // flagging
    this.router.post('/flag-vendor',
      upload.array('files', 5),
      uploadToCloudinary, validateBody(FlaggingSchema), this.controller.flagVendor);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new ReviewRoutes().getRouter();
