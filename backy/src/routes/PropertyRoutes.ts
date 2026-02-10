import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { PropertyController } from '../controllers/PropertyController';
import { createAddressSchema, updateAddressSchema } from "../validations/addressValidations"
import { validateBody } from '../middleware/bodyValidate';
import { authenticate } from '../middleware/authMiddleware';


class PropertyRoutes {
  private router: Router;
  private controller: PropertyController;

  constructor() {
    this.router = Router();
    this.controller = container.get<PropertyController>(TYPES.PropertyController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    // this.router.post('/', authenticate, validateBody(createAddressSchema), this.controller.createAddress);
    // this.router.get('/', authenticate, this.controller.getUserAddresses);
    // this.router.get('/default', authenticate, this.controller.getDefaultAddress);
    // this.router.patch('/:id', authenticate, validateBody(updateAddressSchema), this.controller.updateAddress);
    // this.router.delete('/:id', authenticate, this.controller.deleteAddress);

    // Public routes
    this.router.get('/search', this.controller.searchProperties);
    this.router.get('/featured', this.controller.getFeaturedProperties);
    this.router.get('/premium', this.controller.getPremiumProperties);
    this.router.get('/nearby', this.controller.searchNearby);
    this.router.get('/statistics', this.controller.getStatistics);
    this.router.get('/slug/:slug', this.controller.getPropertyBySlug);
    this.router.get('/:id', this.controller.getPropertyById);
    this.router.get('/:id/similar', this.controller.getSimilarProperties);

    // Protected routes (require authentication)
    // Uncomment and add your authentication middleware
    // this.router.use(authenticate);

    this.router.post('/', this.controller.createProperty);
    this.router.get('/my-properties', this.controller.getMyProperties);
    this.router.put('/:id', this.controller.updateProperty);
    this.router.delete('/:id', this.controller.deleteProperty);
    this.router.post('/:id/publish', this.controller.publishProperty);
    this.router.post('/:id/sold', this.controller.markAsSold);
    this.router.post('/:id/rented', this.controller.markAsRented);
    this.router.post('/:id/favorite', this.controller.addToFavorites);
    this.router.delete('/:id/favorite', this.controller.removeFromFavorites);
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
