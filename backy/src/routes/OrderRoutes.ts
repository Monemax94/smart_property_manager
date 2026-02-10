import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { OrderController } from '../controllers/OrderController';
import OrderTrackingRoute from './OrderTrackingRoutes';
import {createOrderSchema} from "../validations/orderValidation"
import { validateBody } from '../middleware/bodyValidate';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';
class OrderRoutes {
  private router: Router;
  private controller: OrderController;

  constructor() {
    this.router = Router();
    this.controller = container.get<OrderController>(TYPES.OrderController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/',  authenticate, validateBody(createOrderSchema), this.controller.create);
    this.router.post('/cart',  authenticate, this.controller.create);
    this.router.get('/', authenticate, this.controller.findUserOrders);
    this.router.get('/all', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), this.controller.findAll);
    this.router.get('/:id', this.controller.findById);
    this.router.patch('/:id', this.controller.update);
    this.router.delete('/:id', this.controller.delete);
    this.router.use('/tracking', OrderTrackingRoute);
    this.router.patch(
      '/confirm/:orderId',
      this.controller.confirmOrderDelivered
    ); 
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new OrderRoutes().getRouter();
