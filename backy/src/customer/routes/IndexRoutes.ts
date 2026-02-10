import { Router } from 'express';
import { injectable, inject } from 'inversify';
import CartRoutes from './CartRoutes';
import WishlistRoutes from './WishlistRoutes';
import { authenticate } from '../../middleware/authMiddleware';
import ProductRequestRoutes from './ProductRequestRoutes';
import OrderRoutes from './OrderRoutes';
import { TYPES } from '../../config/types';
import { VendorController } from '../../admin/controller/VendorController';
import { container } from '../../config/inversify.config';

@injectable()
export class IndexRoutes {

  private router: Router;
  private vendorController: VendorController;

  constructor() {
    this.router = Router();
    this.router.use(authenticate);
    this.vendorController = container.get<VendorController>(TYPES.VendorController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use('/carts', CartRoutes);
    this.router.get('/vendor-profile/:vendorId', this.vendorController.getVendorProfileWithStats);
    this.router.use('/orders', OrderRoutes);
    this.router.use('/wishlist', WishlistRoutes);
    this.router.use('/product-request', ProductRequestRoutes);
  }
  public getRouter(): Router {
    return this.router;
  }
}

export default new IndexRoutes().getRouter();