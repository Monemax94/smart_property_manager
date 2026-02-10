import { Router } from 'express';
import { container } from '../../config/inversify.config';
import { TYPES } from '../../config/types';
import { CategoryController } from '../../admin/controller/CategoryController';
import { upload } from '../../config/multer.config';
import { uploadToCloudinary } from '../../middleware/cloudinaryUploads';
import {authenticate, authorize} from "../../middleware/authMiddleware"
import { UserRole } from '../../models/User';
class CategoryRoutes {
  private router: Router;
  private controller: CategoryController;

  constructor() {
    this.router = Router();
    this.controller = container.get<CategoryController>(TYPES.CategoryController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/',
      authenticate,
      upload.array('files', 5),
    uploadToCloudinary,this.controller.create);
    this.router.get('/', this.controller.list);
    this.router.get('/:id', this.controller.getById);
    this.router.get('/products/:categoryId', this.controller.getCategoryProducts);
    this.router.patch('/:id', this.controller.update);
    this.router.delete('/:id',this.controller.delete);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new CategoryRoutes().getRouter();
