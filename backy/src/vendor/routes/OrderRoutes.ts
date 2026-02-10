import { Router } from 'express';
import { container } from '../../config/inversify.config';
import { TYPES } from '../../config/types';
import { VendorOrderController } from '../controller/VendorOrderController';
import { upload } from '../../config/multer.config';
import { uploadToCloudinary } from '../../middleware/cloudinaryUploads';
import { validateBody } from '../../middleware/bodyValidate';
import { shippingValidationSchema } from '../../validations/orderValidation';
class OrderRoutes {
  private router: Router;
  private controller: VendorOrderController;

  constructor() {
    this.router = Router();
    this.controller = container.get<VendorOrderController>(TYPES.VendorOrderController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    this.router.get('/', this.controller.getVendorOrders);
    this.router.get('/best-selling-products', this.controller.getBestSelling);
    this.router.patch('/order-state-delivered/:orderId',
      upload.array('files', 5),
      uploadToCloudinary,
      this.controller.updateOrderToDeleivered
    );
    this.router.patch('/order-state-shipped/:orderId',
      upload.array('files', 5),
      uploadToCloudinary,
      validateBody(shippingValidationSchema),
      this.controller.updateOrderToShipped
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new OrderRoutes().getRouter();
