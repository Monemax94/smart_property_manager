import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { upload } from '../config/multer.config';
import { uploadToCloudinary } from '../middleware/cloudinaryUploads';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/bodyValidate';
import { carouselValidationSchema } from '../validations/carouselValidation';
import { CarouselController } from '../controllers/CarouselController';
import { UserRole } from '../models/User';

class CarouselRoutes {
  private router: Router;
  private controller: CarouselController;

  constructor() {
    this.router = Router();
    this.controller = container.get<CarouselController>(TYPES.CarouselController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/',
      authenticate,
      authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
      upload.array('files', 5),
      uploadToCloudinary,
      validateBody(carouselValidationSchema),
      this.controller.create);
    this.router.patch(
      '/:bannerId',
      authenticate,
      authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
      upload.array('files', 5),
      uploadToCloudinary,
      this.controller.update
    );
    this.router.get("/", this.controller.getAll);
    this.router.get("/active", this.controller.getActive);
    this.router.delete("/:id",
      authenticate,
      authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
      this.controller.delete
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new CarouselRoutes().getRouter();
