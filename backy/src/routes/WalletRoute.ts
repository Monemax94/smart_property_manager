import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';

import { authenticate } from '../middleware/authMiddleware';
import { WalletController } from '../controllers/WalletController';


class WalletRoutes {
  private router: Router;
  private controller: WalletController;

  constructor() {
    this.router = Router();
    this.controller = container.get<WalletController>(TYPES.WalletController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

 
    this.router.post('/create', authenticate, this.controller.getOrCreateWallet);
    this.router.get('/balance', authenticate, this.controller.getBalance);
    this.router.post('/fund', authenticate, this.controller.fundWallet);
    this.router.post('/confirm-funding', authenticate, this.controller.confirmFunding);
    this.router.post('/withdraw', authenticate, this.controller.withdraw);
    this.router.get('/transactions', authenticate, this.controller.getTransactionHistory);
    this.router.post('/payment-methods', authenticate, this.controller.addPaymentMethod);
    this.router.delete('/payment-methods/:cardId', authenticate, this.controller.removePaymentMethod);
    this.router.post('/payment-methods/default', authenticate, this.controller.setDefaultPaymentMethod);
    this.router.get('/payment-methods', authenticate, this.controller.getPaymentMethods);
  
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new WalletRoutes().getRouter();
