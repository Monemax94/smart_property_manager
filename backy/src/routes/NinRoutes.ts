import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { NINVerificationController } from '../controllers/NinverificationController';

class NinRoutes {
    private router = Router();
    private controller = container.get<NINVerificationController>(TYPES.NINVerificationController);

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.post('/:nin', this.controller.verifyNIN);
        this.router.post('/nin-phone/:phone', this.controller.verifyNINWithPhone);
        this.router.post('/nin/comprehensive', this.controller.comprehensiveVerification);
        this.router.get('/nin/test', this.controller.testVerification);
    }

    public getRouter() {
        return this.router;
    }
}

export default new NinRoutes().getRouter();
