import { Router } from "express";
import {NewsLetterController} from "../controllers/NewsLetterController";
import { NewsletterValidation } from '../validations/newsletterValidation';
import { validateBody } from "../middleware/bodyValidate";
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';


class NewsletterRoutes {
    public router: Router;
    private controller = container.get<NewsLetterController>(TYPES.NewsLetterController);

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Public routes
        this.router.post(
            '/subscribe',
            validateBody(NewsletterValidation.subscribeSchema),
            this.controller.subscribe
        );
        this.router.post(
            '/unsubscribe',
            validateBody(NewsletterValidation.unsubscribeSchema),
            this.controller.unsubscribe
        );
        this.router.get(
            '/status',
            this.controller.getStatus
        );
        this.router.patch(
            '/preferences/:email',
            validateBody(NewsletterValidation.updatePreferencesSchema),
            this.controller.updatePreferences
        );
        this.router.get('/subscribers/:organization', this.controller.getSubscribers);
    }
}

export default new NewsletterRoutes().router;