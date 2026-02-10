import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import ProductRoutes from './ProductRoutes';
import CategoryRoutes from './CategoryRoutes';
import { UserRole } from '../../models/User';
import { container } from '../../config/inversify.config';
import { TYPES } from '../../config/types';
import { VendorAnalyticsController } from '../controller/VendorAnalyticsController';
import ProfileRoutes from './ProfileRoutes';
import OrderRoutes from './OrderRoutes';

class IndexRoutes {
    private router = Router();
    private analyticsStatsController = container.get<VendorAnalyticsController>(TYPES.VendorAnalyticsController);
   
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.use(authenticate)
        this.router.get('/search', this.analyticsStatsController.getVendorsWithSearchOptions)
        this.router.use(authorize([UserRole.VENDOR]))
        
        this.router.use(
            '/products',
            ProductRoutes
        );
        this.router.use(
            '/profile',
            ProfileRoutes
        );
        this.router.use(
            '/orders',
            OrderRoutes
        );
        this.router.use(
            '/statistics',
            this.analyticsStatsController.getDashboardStatistics
        );
        this.router.use(
            '/statistics-filters',
            this.analyticsStatsController.getDashboardStatisticsWithQueries
        );
        this.router.use(
            '/categories',
            CategoryRoutes
        );
    }

    public getRouter() {
        return this.router;
    }
}

export default new IndexRoutes().getRouter();
