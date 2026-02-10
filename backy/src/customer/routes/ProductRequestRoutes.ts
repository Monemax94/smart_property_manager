import { Router } from 'express';
import { injectable } from 'inversify';
import { ProductRequestController } from '../controllers/ProductRequestController';
import { TYPES } from '../../config/types';
import { authenticate } from '../../middleware/authMiddleware';
import { validateBody } from '../../middleware/bodyValidate';
import { container } from '../../config/inversify.config';
import { uploadToCloudinary } from '../../middleware/cloudinaryUploads';
import { upload } from '../../config/multer.config';
import { acceptOfferSchema, createRequestSchema } from '../../validations/productValidations';

@injectable()
export class ProductRequestRoutes {

  private router: Router;
  private controller: ProductRequestController;

  constructor() {
    this.router = Router();
    this.controller = container.get<ProductRequestController>(TYPES.ProductRequestController);
    this.router.use(authenticate);
    this.initializeRoutes();
  }

  private initializeRoutes() {

    this.router.post('/requests',
      authenticate,
      upload.array('files', 20),
      uploadToCloudinary,
      validateBody(createRequestSchema),
      this.controller.createRequest
    );
    this.router.get('/requests/:id', this.controller.getRequest);
    this.router.get('/customer/:customerId/requests', authenticate, this.controller.getCustomerRequests);
    this.router.get('/requests', this.controller.getActiveRequests);

    this.router.post('/requests/:requestId/offers', authenticate, this.controller.addVendorOffer);
    this.router.patch('/requests/:requestId/offers/:offerId/accept', authenticate, validateBody(acceptOfferSchema), this.controller.acceptOffer);
    this.router.post('/requests/:requestId/place-order', authenticate, this.controller.placeOrder);
  }
  public getRouter(): Router {
    return this.router;
  }
}

export default new ProductRequestRoutes().getRouter();