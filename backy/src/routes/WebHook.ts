import express, { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { PaymentController } from '../controllers/PaymentController';
import { authenticate } from '../middleware/authMiddleware';

class WebHookRoutes {
  public router: Router;
  private controller: PaymentController;

  constructor() {
    this.router = Router();
    this.controller = container.get<PaymentController>(TYPES.PaymentController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //Public route (NO AUTH)
    this.router.post(
      '/paystack/webhook',
      this.controller.handlePaystackWebhook.bind(PaymentController)
    );

    // Protected routes
    this.router.use(authenticate);
    this.router.get('/history', this.controller.getPaymentHistory.bind(PaymentController));
    this.router.post("/initialize", this.controller.createPaymentIntent.bind(PaymentController));
    this.router.post('/verify', this.controller.verifyPayment.bind(PaymentController));
  }
}
export default new WebHookRoutes().router;
