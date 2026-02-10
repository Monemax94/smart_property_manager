import { Router } from 'express';
import { injectable, inject } from 'inversify';
import { WishlistController } from '../controllers/WishlistController';
import { TYPES } from '../../config/types';
import { authenticate } from '../../middleware/authMiddleware';
import { container } from '../../config/inversify.config';

@injectable()
export class WishlistRoutes {
  private router: Router;
  private controller: WishlistController;

  constructor() {
    this.router = Router();
    this.controller = container.get<WishlistController>(TYPES.WishlistController);
    this.router.use(authenticate);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.controller.getWishlist.bind(this.controller));
    this.router.post(
      '/items/:productId',
      this.controller.addToWishlist.bind(this.controller)
    );
    this.router.delete(
      '/items/:productId',
      this.controller.removeFromWishlist.bind(this.controller)
    );
    this.router.delete(
      '/clear',
      this.controller.clearWishlist.bind(this.controller)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new WishlistRoutes().getRouter();