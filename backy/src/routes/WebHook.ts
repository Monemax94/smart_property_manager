import express, { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { StripeWebhookController } from '../controllers/StripeWebhookController';
import { authenticate } from '../middleware/authMiddleware';

class WebHookRoutes {
  public router: Router;
  private controller: StripeWebhookController;

  constructor() {
    this.router = Router();
    this.controller = container.get<StripeWebhookController>(TYPES.StripeWebhookController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      '/stripe/webhook',
      authenticate,
      express.raw({ type: 'application/json' }),
      this.controller.handleWebhook
    )
    this.router.post(
      '/stripe/intent',
      authenticate,
      this.controller.createPaymentForCart
    )
    this.router.post(
      '/stripe/intent-verify',
      authenticate,
      this.controller.verifyPaymentIntent
    )
  }
}
export default new WebHookRoutes().router;
