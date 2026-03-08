import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { PropertyController } from '../controllers/PropertyController';
import { createAddressSchema, updateAddressSchema } from "../validations/addressValidations"
import { validateBody } from '../middleware/bodyValidate';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';
import { upload } from '../config/multer.config';
import { uploadToCloudinary } from '../middleware/cloudinaryUploads';


class PropertyRoutes {
  private router: Router;
  private controller: PropertyController;

  constructor() {
    this.router = Router();
    this.controller = container.get<PropertyController>(TYPES.PropertyController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    // Admin/Owner Management Protected routes (Specific routes first)
    this.router.get('/statistics', authenticate, requireAdmin, this.controller.getStatistics);
    this.router.get('/my-properties', authenticate, requireAdmin, this.controller.getMyProperties);

    // Public routes (No auth needed or just basic auth)
    this.router.get('/search', this.controller.searchProperties);
    this.router.get('/featured', this.controller.getFeaturedProperties);
    this.router.get('/premium', this.controller.getPremiumProperties);
    this.router.get('/nearby', this.controller.searchNearby);
    this.router.get('/slug/:slug', this.controller.getPropertyBySlug);
    this.router.get('/:id', this.controller.getPropertyById);
    this.router.get('/:id/similar', this.controller.getSimilarProperties);

    // Basic Protected routes (Require login only)
    this.router.post('/:id/favorite', authenticate, this.controller.addToFavorites);
    this.router.delete('/:id/favorite', authenticate, this.controller.removeFromFavorites);

    // Default middlewares for remaining management routes
    this.router.use(authenticate);
    this.router.use(requireAdmin);

    this.router.post('/',
      upload.fields([
        { name: 'images', maxCount: 15 },
        { name: 'videos', maxCount: 5 }
      ]),
      uploadToCloudinary,
      (req, res, next) => {
        const uploadedFiles: any[] = req.body.uploadedFiles || [];

        // Split uploaded files by mimetype: videos vs images
        req.body.images = uploadedFiles.filter(
          f => f.fileType === 'video' ? false : true
        );
        req.body.videos = uploadedFiles.filter(
          f => f.fileType === 'video'
        );

        if (req.body.features && typeof req.body.features === 'string') {
          try { req.body.features = JSON.parse(req.body.features); } catch (e) { }
        }
        if (req.body.pricing && typeof req.body.pricing === 'string') {
          try { req.body.pricing = JSON.parse(req.body.pricing); } catch (e) { }
        }
        next();
      },
      this.controller.createProperty
    );
    this.router.put('/:id', this.controller.updateProperty);
    this.router.delete('/:id', this.controller.deleteProperty);
    this.router.post('/:id/publish', this.controller.publishProperty);
    this.router.post('/:id/sold', this.controller.markAsSold);
    this.router.post('/:id/rented', this.controller.markAsRented);
    this.router.post('/:id/feature', this.controller.featureProperty);
    this.router.post('/:id/premium', this.controller.makePremium);

    // Admin only routes
    // this.router.use(authorize(['admin']));
    this.router.post('/:id/verify', this.controller.verifyProperty);

  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new PropertyRoutes().getRouter();
