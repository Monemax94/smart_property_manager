import { Router } from 'express';
import { injectable, inject } from 'inversify';
import { OrderController } from '../controllers/OrderController';
import { TYPES } from '../../config/types';
import { authenticate } from '../../middleware/authMiddleware';
import { container } from '../../config/inversify.config';

@injectable()
export class OrderRoutes {

  private router: Router;
  private controller: OrderController;

  constructor() {
    this.router = Router();
    this.controller = container.get<OrderController>(TYPES.OrderController);
    this.router.use(authenticate);
    this.initializeRoutes();
  }

  private initializeRoutes() {

    // this.router.get(
    //   '/confirm/:orderId',
    //   this.controller.confirmOrderDelivered
    // );
    
    // this.router.get('/', this.controller.getOrders);
    // this.router.get(
    //   '/:orderId',
    //   this.controller.getOrderById
    // )
    
  }
  public getRouter(): Router {
    return this.router;
  }
}

export default new OrderRoutes().getRouter();