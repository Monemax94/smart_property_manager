import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { WishlistController } from '../controllers/WishlistController';
import { authenticate } from '../middleware/authMiddleware';

class WishlistRoutes {
    private router: Router;
    private controller: WishlistController;

    constructor() {
        this.router = Router();
        this.controller = container.get<WishlistController>(TYPES.WishlistController);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.use(authenticate);
        this.router.get('/', this.controller.getWishlist);
        this.router.post('/add/:propertyId', this.controller.addToWishlist);
        this.router.delete('/remove/:propertyId', this.controller.removeFromWishlist);
        this.router.delete('/clear', this.controller.clearWishlist);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default new WishlistRoutes().getRouter();
