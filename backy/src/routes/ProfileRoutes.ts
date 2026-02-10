import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { ProfileController } from '../controllers/ProfileController';
import { upload } from '../config/multer.config';
import { uploadToCloudinary } from '../middleware/cloudinaryUploads';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/bodyValidate';
import { createApplicationPreferenceSchema, updateApplicationPreferenceSchema, updateNotificationPreferenceSchema } from '../validations/preferenceValidations';
import { resetPasswordSchema, setPinSchema } from '../validations/userValidations';

class ProfileRoutes {
  private router: Router;
  private controller: ProfileController;

  constructor() {
    this.router = Router();
    this.controller = container.get<ProfileController>(TYPES.ProfileController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/',
      authenticate,
      upload.array('files', 5),
      uploadToCloudinary,
      this.controller.create);
    this.router.patch('/update-now',
      authenticate,
      upload.array('files', 5),
      uploadToCloudinary,
      this.controller.update
    );
    this.router.post('/transaction-pin', authenticate, validateBody(setPinSchema), this.controller.setTransactionPin);
    this.router.get('/transaction-pin-token', authenticate, this.controller.sendTokenForTransactionPinSetup);
    this.router.get('/', this.controller.list);
    this.router.get('/current', authenticate, this.controller.currentUserProfile);
    this.router.get('/:id', this.controller.getById);

    this.router.delete('/:id', this.controller.delete);
    this.router.post('/reset-password', authenticate, validateBody(resetPasswordSchema), this.controller.resetPassword);
    this.router.patch('/toggle-two-factor', authenticate, this.controller.toggleTwoFactor);
    this.router.post('/set-recovery-email', authenticate, this.controller.setRecoveryEmail);

    this.router.get('/notification/preference', authenticate, this.controller.getNotificationPreference);
    this.router.patch('/notification/preference', authenticate, validateBody(updateNotificationPreferenceSchema), this.controller.updateNotificationPreference);

    this.router.get('/activity/logs', authenticate, this.controller.getUserActivityLogs);
    this.router.get('/application/preference', authenticate, this.controller.getApplicationPreferences);
    this.router.patch('/application/preference', authenticate, validateBody(updateApplicationPreferenceSchema), this.controller.updateApplicationPreferences);
    // Setup 2FA - Generate QR code
    this.router.get('/two-factor/setup', authenticate, this.controller.setupTwoFactor);
    // Verify token
    this.router.post('/two-factor/verify', authenticate, this.controller.verifyToken);
    // Enable 2FA
    this.router.post('/two-factor/enable', authenticate, this.controller.enableTwoFactor);
    // Disable 2FA
    this.router.post('/two-factor/disable', authenticate, this.controller.disableTwoFactor);
    // Check 2FA status
    this.router.get('/two-factor/status', authenticate, this.controller.getTwoFactorStatus);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new ProfileRoutes().getRouter();
