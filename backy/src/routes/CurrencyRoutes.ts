import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { CurrencyController } from '../controllers/CurrencyController';
import { UserRole } from '../models/User';

class CurrencyRoutes {
  private router: Router;
  private controller: CurrencyController;

  constructor() {
    this.router = Router();
    this.controller = container.get<CurrencyController>(TYPES.CurrencyController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    this.router.post('/', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]), this.controller.create);
    this.router.get('/', this.controller.getAll);
    this.router.delete('/:id', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]), this.controller.delete);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new CurrencyRoutes().getRouter();
