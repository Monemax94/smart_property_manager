import { Router } from 'express';
import { container } from '../config/inversify.config';
import { ProductController } from '../controllers/ProductController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { validateBody } from "../middleware/bodyValidate"
import { TYPES } from '../config/types';
import { uploadToCloudinary } from '../middleware/cloudinaryUploads';
import { upload } from '../config/multer.config';

import { createProductSchema, reviewSchema, variantGroupSchema } from '../validations/productValidations';
import { UserRole } from '../models/User';
import { VendorController } from '../admin/controller/VendorController';
export class ProductRoutes {
    private router: Router;
    private controller: ProductController;
    private vendorController: VendorController;

    constructor() {
        this.router = Router();
        this.controller = container.get<ProductController>(TYPES.ProductController);
        this.vendorController = container.get<VendorController>(TYPES.VendorController);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            '/',
            authenticate,
            authorize([UserRole.VENDOR]),
            upload.array('files', 20),
            uploadToCloudinary,
            validateBody(createProductSchema),
            this.controller.createProduct
        );
        this.router.post(
            '/variants/:productId/',
            authenticate,
            upload.array('variantImages', 5),
            uploadToCloudinary,
            validateBody(variantGroupSchema),
            this.controller.addVariant
        );
        this.router.get(
            '/vendor-product-categorized/:vendorId',
            authenticate,
            this.controller.vendorsProductCategorized
        );

        this.router.get('/vendor-all-product/:vendorId', authenticate, this.vendorController.getVendorProducts);
        this.router.delete(
            '/variant/:productId/:variantIndex ',
            authenticate,
            this.controller.removeVariant
        );

        // Public routes
        this.router.get('/best-sellers', this.controller.getPopularProduct);
        this.router.get('/search-products', this.controller.searchProducts);
        this.router.get('/search-products-vendors', this.controller.searchVendorProducts);
        this.router.use('/recommendations', authenticate, this.controller.recommendationRoutes);
        this.router.get('/:id', this.controller.getProductById);
        this.router.get('/category/:categoryId', this.controller.getProductsByCategory);
        // this.router.get('/recommended', this.controller.getRecommendedProducts);
        this.router.post(
            '/review-create',
            authenticate,
            validateBody(reviewSchema),
            this.controller.createReview
        );

        // Get reviews for a product
        this.router.get('/product-reviews/:productId', this.controller.getReviewsByProduct);

        // Get current user’s review for a product
        this.router.get('/product-review-mine/:productId', authenticate, this.controller.getUserReview);

        // Get average rating for a product
        this.router.get('/average-rating/:productId', this.controller.getAverageRating);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default new ProductRoutes().getRouter();

