import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from "../middleware/bodyValidate"
import { AuthController } from '../controllers/AuthController';
import { 
    userBaseSchema,
    forgotEmailSchema,
    updateUserSettingsSchema,
    registerRecoveryEmailSchema,
    LogoutValidationSchema,
    TokenValidationSchema,
    forgotSchema,
    loginSchema,
    userVerifySchema,
    registerSecurityQuestion,
    vendorProfileSchema,
    vendorBaseSchema
} from '../validations/userValidations';
import { uploadToCloudinary } from '../middleware/cloudinaryUploads';
import { upload } from '../config/multer.config';

class AuthRoutes {
    private router = Router();
    private controller = container.get<AuthController>(TYPES.AuthController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            '/register-start',
            this.controller.checkUser
        );
        this.router.post(
            '/register',
            validateBody(userBaseSchema),
            this.controller.register
        );
        this.router.post(
            '/register-vendor',
            validateBody(vendorBaseSchema),
            this.controller.registerVendor
        );
        this.router.post(
            '/register-addon',
            validateBody(updateUserSettingsSchema),
            this.controller.registerFinalization
        );
        this.router.post(
            '/register-security-questions',
            validateBody(registerSecurityQuestion),
            this.controller.registerSecurityQuestions
        );
        this.router.post(
            '/register-recovery-info',
            validateBody(registerRecoveryEmailSchema),
            this.controller.registerSecurityInfo
        );
        this.router.post(
            '/send-token-recovery-email',
            this.controller.sendRecoveryEmailToken
        ); 
        this.router.post(
            '/email-token-resend',
            this.controller.resendResetToken
        ); 
        // admin registrations 
        this.router.post(
            '/register-admin',
            authenticate,
            validateBody(userBaseSchema),
            this.controller.registerAdmin
        );
        // // vendor registrations 
        // this.router.post(
        //     '/vendor/register-vendor-addon',
        //     upload.fields([
        //         { name: 'businessRegistration', maxCount: 1 },
        //         { name: 'vendorNIN', maxCount: 1 },
        //         { name: 'storeLogo', maxCount: 1 },
        //     ]),
        //     uploadToCloudinary,
        //     validateBody(vendorProfileSchema),
        //     this.controller.registerVendorBussinessInfo
        // );

        this.router.post(
            '/verify',
            validateBody(userVerifySchema),
            this.controller.verify
        );

        this.router.post(
            '/login',
            validateBody(loginSchema),
            this.controller.login
        ); 
        // forgot password flow
        this.router.post(
            '/forgot-password',
            this.controller.sendReset
        );
        this.router.post(
            '/token-validation-reset',
            validateBody(TokenValidationSchema),
            this.controller.tokenValidation
        );
        this.router.post(
            '/reset-password',
            validateBody(forgotSchema),
            this.controller.resetPassword
        );
        // end forget password
        this.router.post(
            '/validate-recovery-email',
            this.controller.getEmailAttachToRecoveryEmail
        );
        // forgot email flow
        this.router.post(
            '/sent-token-recovery-email',
            validateBody(forgotEmailSchema),
            this.controller.sendTokenForEmailRecovery
        );
        this.router.post(
            '/verify-token-recovery-email',
            validateBody(TokenValidationSchema),
            this.controller.validateTokenEmailRecovery
        );
        // end forgot email flow
        this.router.post(
            '/refresh-token',
            this.controller.refreshToken
        );
        this.router.post(
            '/logout',
            validateBody(LogoutValidationSchema),
            this.controller.logout
        );
        this.router.post(
            '/google-auth-verify',
            this.controller.verifyGoogleToken
        );
        this.router.get('/google-auth', this.controller.authenticate);
        this.router.get('/google-auth/callback', this.controller.handleCallback);
        this.router.post('/google-auth', this.controller.getUserProfile);


    }

    public getRouter() {
        return this.router;
    }
}

export default new AuthRoutes().getRouter();