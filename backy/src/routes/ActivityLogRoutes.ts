import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { authenticate } from '../middleware/authMiddleware';
import { ActivityLogController } from '../controllers/ActivityLogController';

class ActivityLogRoutes {
    private router = Router();
    private controller = container.get<ActivityLogController>(TYPES.ActivityLogController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            '/vendor/:vendorId',
            authenticate,
            this.controller.getVendorActivities
        );
        this.router.get(
            '/user/:userId',
            authenticate,
            this.controller.getVendorActivities
        );
    }

    public getRouter() {
        return this.router;
    }
}

export default new ActivityLogRoutes().getRouter();
