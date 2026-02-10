import { Router } from 'express';
import { injectable, inject } from 'inversify';
import { CartController } from '../controllers/CartController';
import { TYPES } from '../../config/types';
import { authenticate } from '../../middleware/authMiddleware';
import { cartValidations } from '../../validations/cartValidations';
import { validateBody } from '../../middleware/bodyValidate';
import { container } from '../../config/inversify.config';
import { requestProductValidationSchema } from '../../validations/productValidations';

@injectable()
export class CartRoutes {

  private router: Router;
  private controller: CartController;

  constructor() {
    this.router = Router();
    this.controller = container.get<CartController>(TYPES.CartController);
    this.router.use(authenticate);
    this.initializeRoutes();
  }

  private initializeRoutes() {

    this.router.get('/', this.controller.getCart);
    this.router.get('/cart-summary', this.controller.getCartSummary);
    this.router.post(
      '/items',
      validateBody(cartValidations.addToCart ),
      this.controller.addToCart
    );
    this.router.post(
      '/items-request',
      validateBody(requestProductValidationSchema ),
      this.controller.requestProduct
    );
    this.router.delete(
      '/items/:productId',
      this.controller.removeFromCart
    );
    this.router.patch(
      '/items/:productId/quantity',
      validateBody( cartValidations.updateQuantity),
      this.controller.updateQuantity
    );
    this.router.delete(
      '/clear',
      this.controller.clearCart
    );
    this.router.get(
      '/count',
      this.controller.getCartCount
    );
  }
  public getRouter(): Router {
    return this.router;
  }
}

export default new CartRoutes().getRouter();