import { Router } from 'express';
import { container } from '../../config/inversify.config';
import { TYPES } from '../../config/types';
import { upload } from '../../config/multer.config';
import { VendorProfileController } from '../controller/VendorProfileController';
import { VendorAnalyticsController } from '../controller/VendorAnalyticsController';
import { uploadToCloudinary } from '../../middleware/cloudinaryUploads';
import { validateBody } from '../../middleware/bodyValidate';
import { updateVendorProfileSchema } from '../../validations/userValidations';
import { createOrUpdateBankPayoutSchema } from '../../validations/profileValidation';
class ProfileRoutes {
    private router = Router();
    private controller = container.get<VendorAnalyticsController>(TYPES.VendorAnalyticsController);
    private vendorProfileController = container.get<VendorProfileController>(TYPES.VendorProfileController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            '/',
            this.controller.getVendorProfile
        );
        this.router.post(
            '/',
            upload.fields([
                { name: 'businessRegistration', maxCount: 1 },
                { name: 'vendorNIN', maxCount: 1 },
                { name: 'storeLogo', maxCount: 1 },
            ]),
            uploadToCloudinary,
            validateBody(updateVendorProfileSchema),
            this.vendorProfileController.updateProfile
        );
        // reviews
        this.router.get(
            '/vendor-reviews',
            this.vendorProfileController.getVendorReviews
        );

        // payout sections 
        this.router.get(
            '/payout-history',
            this.vendorProfileController.getPayoutHistory
        );
        this.router.get(
            '/payout-request',
            this.vendorProfileController.requestPayout
        );
        this.router.get(
            '/payout-account-balance',
            this.vendorProfileController.getBalance
        );
        this.router.get(
            '/payout-balance',
            this.vendorProfileController.getPayoutBalance
        );
        this.router.get(
            '/payout-details/:payoutId',
            this.vendorProfileController.getPayoutDetails
        );
        this.router.post(
            '/payout-setup',
            this.vendorProfileController.setupStripeAccount
        );
        this.router.post(
            '/payout-request',
            this.vendorProfileController.createPayout
        );
        this.router.post(
            '/payout-transfer',
            this.vendorProfileController.transferToVendorStripe
        );
        this.router.get(
            '/payout-statistics',
            this.vendorProfileController.getPayoutStats
        );
        // Create or Update banks
        this.router.post("/bank", validateBody(createOrUpdateBankPayoutSchema), this.vendorProfileController.createOrUpdateBank);
        // Get vendor payout
        this.router.get("/bank/me", this.vendorProfileController.getMyBank);
        this.router.delete("/bank/:id", this.vendorProfileController.deleteBank);

    }

    public getRouter() {
        return this.router;
    }
}

export default new ProfileRoutes().getRouter();