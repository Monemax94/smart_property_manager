import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from "../middleware/bodyValidate"
import { uploadToCloudinary } from '../middleware/cloudinaryUploads';
import { upload } from '../config/multer.config';
import { DisputeController } from '../controllers/DisputeController';
import { createDisputeSchema, updateDisputeStatusSchema, respondToDisputeSchema } from '../validations/disputeValidation';

class DisputeRoutes {
    private router = Router();
    private controller = container.get<DisputeController>(TYPES.DisputeController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            '/',
            authenticate,
            this.controller.getCurrentUserDisputes
        );

        this.router.post(
            '/',
            authenticate,
            upload.array('files', 5),
            uploadToCloudinary,
            validateBody(createDisputeSchema),
            this.controller.create
        );

        this.router.get(
            '/:id',
            authenticate,
            this.controller.getOne
        );

        this.router.patch(
            "/:id/status",
            authenticate,
            validateBody(updateDisputeStatusSchema),
            this.controller.updateStatus
        );

        this.router.post(
            '/:id/respond',
            authenticate,
            validateBody(respondToDisputeSchema),
            this.controller.respond
        );
        this.router.delete(
            '/:id',
            authenticate,
            this.controller.delete
        );
    }

    public getRouter() {
        return this.router;
    }
}

export default new DisputeRoutes().getRouter();
