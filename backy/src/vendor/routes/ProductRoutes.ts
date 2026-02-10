import { Router } from 'express';
import { container } from '../../config/inversify.config';
import { TYPES } from '../../config/types';
import { ProductController } from '../../controllers/ProductController';
import { validateBody } from "../../middleware/bodyValidate"
import { uploadToCloudinary } from '../../middleware/cloudinaryUploads';
import { upload } from '../../config/multer.config';
import { createProductSchema, verifyAvailabilityRequestSchema } from '../../validations/productValidations';
import { VendorProductController } from '../controller/ProductController';
class ProductRoutes {
    private router = Router();
    private controller = container.get<ProductController>(TYPES.ProductController);
    private controllerVendorProduct = container.get<VendorProductController>(TYPES.VendorProductController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            '/',
            upload.array('files', 5),
            uploadToCloudinary,
            validateBody(createProductSchema),
            this.controller.createProduct
        );
        this.router.get(
            '/',
            this.controllerVendorProduct.getVendorProducts
        );
        this.router.get(
            '/categories-counts',
            this.controllerVendorProduct.getVendorProductsCategoriesCounts
        );
       
        this.router.get(
            '/product-request',
            this.controllerVendorProduct.getVendorProductRequests
        );
        this.router.patch(
            '/:productId/availability/:requestId/verify',
            validateBody(verifyAvailabilityRequestSchema),
            this.controllerVendorProduct.verifyAvailabilityRequest
        );
        this.router.patch(
            '/:productId/availabilty/:requestId/reject',
            this.controllerVendorProduct.rejectAvailabilityRequest
        );
        this.router.get(
            '/:id',
            this.controllerVendorProduct.getVendorProductById
        );
        this.router.patch(
            '/publish/:productId',
            this.controllerVendorProduct.publishProduct
        );
        this.router.patch(
            '/unpublish/:productId',
            this.controllerVendorProduct.unpublishProduct
        );
    }

    public getRouter() {
        return this.router;
    }
}

export default new ProductRoutes().getRouter();
