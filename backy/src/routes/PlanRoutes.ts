import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { PlanController } from '../controllers/PlanController';
import { authenticate } from '../middleware/authMiddleware';

class PlanRoutes {
  public router: Router;
  private controller: PlanController;

  constructor() {
    this.router = Router();
    this.controller = container.get<PlanController>(TYPES.PlanController);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.controller.getAllPlans);
    this.router.get('/:id', this.controller.getPlanById);
    this.router.post('/', authenticate, this.controller.createPlan);
    this.router.put('/:id', authenticate, this.controller.updatePlan);
    this.router.delete('/:id', authenticate,  this.controller.deletePlan);
  }
}

export default new PlanRoutes().router;
