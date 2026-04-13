import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { UserController } from '../controllers/UserController';

class UserRoutes {
  private router: Router;
  private controller: UserController;

  constructor() {
    this.router = Router();
    this.controller = container.get<UserController>(TYPES.UserController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/email/:email', this.controller.getUserByEmail);
    this.router.get('/active', this.controller.getActiveUsers);
    this.router.get('/agents', this.controller.getAgents);

    // PATCH endpoints
    this.router.patch('/verify/:userId', this.controller.verifyUser);
    this.router.patch('/deactivate/:userId', this.controller.deactivateAccount);
    this.router.patch('/password/:userId', this.controller.updatePassword);
  }

  public getRouter(): Router {
    return this.router;
  }
}
export default new UserRoutes().getRouter()