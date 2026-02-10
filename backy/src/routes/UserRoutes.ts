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
    // GET endpoints
    this.router.get('/email/:email', (req, res) => 
      this.controller.execute(req, res));
    this.router.get('/active', (req, res) => 
      this.controller.execute(req, res));

    // PATCH endpoints
    this.router.patch('/verify/:userId', (req, res) => 
      this.controller.execute(req, res));
    this.router.patch('/deactivate/:userId', (req, res) => 
      this.controller.execute(req, res));
    this.router.patch('/password/:userId', (req, res) => 
      this.controller.execute(req, res));
  }

  public getRouter(): Router {
    return this.router;
  }
}
export default new UserRoutes().getRouter()