import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ProfileService } from '../services/ProfileService';
import { TYPES } from '../config/types';
import { AuthenticatedRequest, TokenType } from '../types/customRequest';
import { PreferenceService } from '../services/PreferenceService';
import { ActivityLogService } from '../services/ActivityLogService';
import { UserService } from '../services/UserService';
import { IUserRepository } from '../interfaces/IUserRepository';
import { ActivityType } from '../models/ActivityLog';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { AuthService } from '../services/AuthService';
import TokenService from '../services/TokenService';
import { MailService } from '../services/MailService';
import { ITwoFactorService } from '../interfaces/ITwoFactor';

@injectable()
export class ProfileController {
  constructor(
    @inject(TYPES.ProfileService) private profileService: ProfileService,
    @inject(TYPES.PreferenceService) private prefServices: PreferenceService,
    @inject(TYPES.UserService) private userService: UserService,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.TokenService) private tokenService: TokenService,
    @inject(TYPES.MailService) private mailService: MailService,
    @inject(TYPES.ActivityLogService) private activityService: ActivityLogService,
    @inject(TYPES.UserRepository) private userRepo: IUserRepository,
    @inject(TYPES.TwoFactorService) private twoFactorService: ITwoFactorService,
    @inject(TYPES.ActivityLogService) private activityLogs: ActivityLogService,
  ) { }

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { uploadedFiles, ...data } = req.body;
    const userId = req.user._id;
    const uploadedFilex = req.body.uploadedFiles || [];

    const result = await this.profileService.create(
      { ...data, photo: uploadedFilex },
      userId.toString()
    );

    res.status(201).json(new ApiResponse(201, result, 'Profile created successfully'));
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.profileService.findById(req.params.id);

    if (!result) {
      return res.status(404).json(ApiError.notFound('Profile not found'));
    }

    res.json(new ApiResponse(200, result, 'Profile retrieved successfully'));
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { uploadedFiles, phoneNumber, ...data } = req.body;
    const userId = req.user._id;
    const uploadedFilex = req.body.uploadedFiles || [];

    const promises: Promise<any>[] = [
      this.profileService.update(
        userId.toString(),
        { ...data, photo: uploadedFilex }
      )
    ];

    if (phoneNumber) {
      promises.push(
        this.userService.updateUserInfo(userId, { phoneNumber })
      );
    }

    await Promise.all(promises);
    const userInfo = await this.userRepo.findByEmail(req.user?.email);
    const userObj = userInfo?.toObject() || {};
    const { password, ...profile } = userObj;
    return res.json(ApiResponse.success(profile, 'Profile updated successfully'));
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.profileService.delete(req.params.id);

    res.status(204).send();
  });

  list = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const profiles = await this.profileService.findAll();

    res.json(new ApiResponse(200, profiles, 'Profiles retrieved successfully'));
  });

  currentUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;
    const [profiles, logs] = await Promise.all([
      this.profileService.findUserById(userId.toString()),
      this.activityLogs.getUserActivities(userId.toString())
    ]);
    return res.json(new ApiResponse(200, profiles, 'User profile retrieved successfully'));
  });

  getNotificationPreference = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await this.prefServices.getUserProfileWithNotifcationPreferences(req.user._id);

    if (!profile) {
      return res.status(404).json(ApiError.notFound('User not found'));
    }

    res.json(new ApiResponse(200, profile, 'Notification preferences retrieved successfully'));
  });

  updateNotificationPreference = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const updateData = req.body;
    const profile = await this.prefServices.updateNotificationPreferences(
      req.user._id,
      updateData
    );

    if (!profile) {
      return res.status(404).json(ApiError.notFound('User not found'));
    }

    res.json(new ApiResponse(200, profile, 'Notification preferences updated successfully'));
  });

  getApplicationPreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const preferences = await this.prefServices.getApplicationPreferences(
      req.user._id.toString()
    );

    res.json(new ApiResponse(200, preferences, 'Application preferences retrieved successfully'));
  });

  getUserActivityLogs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const activityLogs = await this.activityLogs.getUserActivities(
      req.user._id.toString()
    );

    res.json(new ApiResponse(200, activityLogs, 'User activity logs retrieved successfully'));
  });

  updateApplicationPreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const updatedPrefs = await this.prefServices.updateApplicationPreferences(
      req.user._id,
      req.body
    );
    return res.json(ApiResponse.success(updatedPrefs, 'Application preferences updated successfully'));
  });

  resetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json(
        ApiError.badRequest('Old password and new password are required')
      )
    }

    if (newPassword.length < 6) {
      return res.status(400).json(
        ApiError.badRequest('New password must be at least 6 characters long')
      )
    }

    const user = await this.userRepo.findById(userId.toString());
    if (!user) return res.status(404).json(ApiError.notFound('User not found'));

    const [isMatch, isSameAsOld] = await Promise.all([
      user.comparePassword(oldPassword),
      user.comparePassword(newPassword)
    ]);

    if (!isMatch) return res.status(400).json(ApiError.badRequest('Old password is incorrect'));
    if (isSameAsOld) return res.status(400).json(ApiError.badRequest('New password cannot be the same as the old password'));


    // Update password
    user.password = newPassword;
    await user.save();

    await this.activityService.logActivity({
      title: 'Password Reset',
      description: `${user.email} reset password`,
      activityType: ActivityType.PASSWORD_RESET,
      user: req.user?._id,
    });

    return res.json(new ApiResponse(200, null, 'Password reset successfully'));
  });

  sendTokenForTransactionPinSetup = asyncHandler(async (req: Request, res: Response) => {
    const email = req.user?.email;
    // Create token linked to recovery email
    const token = await this.tokenService.createVerificationToken(
      TokenType.TRANSACTION_PIN,
      null,
      email
    );

    await Promise.all([
      this.mailService.sendTransactionPinToken(email, token),
      this.activityService.logActivity({
        title: 'Transaction Pin Token Sent',
        description: `Token sent to ${email}`,
        activityType: ActivityType.PIN_RESET,
        user: req.user?._id,
      }),
    ]);

    return res.json(ApiResponse.success(null, 'Token for transaction pin setup sent to your email address'));
  });


  setTransactionPin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { pin, token } = req.body;
    const userId = req.user?._id;
    const email = req.user?.email;
    if (!userId || !email) {
      return res.status(401).json(ApiError.unauthorized("User not authenticated"));
    }
    const [isTokenValid, hasUserValidatedToken] = await Promise.all([
      this.tokenService.validateToken(token, email),
      this.tokenService.getUsedTokenForUser(email)
    ]);
    if (!isTokenValid || !hasUserValidatedToken) {
      return res.status(400).json(
        ApiError.badRequest(
          !isTokenValid
            ? 'Invalid token'
            : 'Please complete token validation for your account'
        )
      );
    }

    // Find user
    const pinSet = await this.authService.setTransactionPin(userId, pin);
    if (!pinSet) {
      return res.status(500).json(ApiError.internal("pin creation failed"));
    }
    // delete the token
    await this.tokenService.deleteToken(email)
    res.json(ApiResponse.success({}, 'Transaction pin set successfully'));
  });

  toggleTwoFactor = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;
    const result = await this.userService.toggleTwoFactor(userId);

    res.json(new ApiResponse(200, result, 'Two-factor authentication toggled successfully'));
  });

  setRecoveryEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { recoveryEmail } = req.body;

    if (!recoveryEmail) {
      throw ApiError.badRequest('Recovery email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) {
      throw ApiError.badRequest('Please provide a valid email address');
    }

    const userId = req.user?._id;
    const user = await this.userService.findById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.recoveryEmail = recoveryEmail;
    await Promise.all([
      user.save(),
      this.activityService.logActivity({
        title: 'Recovery Email Set',
        description: `User set recovery email: ${recoveryEmail}`,
        activityType: ActivityType.ACCOUNT_RECOVERY_EMAIL_SETUP,
        user: userId
      })
    ]);

    res.json(new ApiResponse(200, null, 'Recovery email set successfully'));
  });

  /**
   * GET /api/2fa/setup
   * Generate QR code for 2FA setup
   */
  setupTwoFactor = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const result = await this.twoFactorService.generateSecret(userId, email);

    return res.status(200).json(
      ApiResponse.success(
        {
          qrCode: result.qrCodeUrl,
          manualEntryKey: result.manualEntryKey,
          instructions: [
            '1. Download Google Authenticator or similar app',
            '2. Scan the QR code or enter the manual key',
            '3. Enter the 6-digit code to verify',
          ],
        },
        'Scan the QR code with your authenticator app'
      )
    );

  })

  /**
   * POST /api/2fa/verify
   * Verify token from authenticator app
   */
  verifyToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json(ApiError.unauthorized(
        'Unauthorized'
      ));
    }

    if (!token || token.length !== 6) {
      return res.status(400).json(
        ApiError.badRequest(
          'Invalid token format. Must be 6 digits.'
        )
      );
    }

    const result = await this.twoFactorService.verifyToken(userId, token);
    if (!result.verified) {
      return res.status(400).json(
        ApiError.badRequest(result.message)
      )
    }
    return res.status(200).json(
      ApiResponse.success(result.message)
    )
  })

  /**
   * POST /api/2fa/enable
   * Enable 2FA after successful verification
   */
  enableTwoFactor = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const userId = req.user?.id;
    const { token } = req.body;
    if (!userId) {
      return res.status(401).json(ApiError.unauthorized(
        'Unauthorized'
      ));
    }

    if (!token || token.length !== 6) {
      return res.status(400).json(
        ApiError.badRequest(
          'Invalid token format. Must be 6 digits.'
        )
      );
    }
    const result = await this.twoFactorService.enableTwoFactor(userId, token);

    if (!result.verified) {
      return res.status(400).json(
        ApiError.badRequest(result.message)
      )
    }
    return res.status(200).json(
      ApiResponse.success(result.message)
    )

  })

  /**
   * POST /api/2fa/disable
   * Disable 2FA with token verification
   */
  disableTwoFactor = asyncHandler(async (req: Request, res: Response) => {

    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json(ApiError.unauthorized(
        'Unauthorized'
      ));
    }

    if (!token || token.length !== 6) {
      return res.status(400).json(
        ApiError.badRequest(
          'Invalid token format. Must be 6 digits.'
        )
      );
    }

    const result = await this.twoFactorService.disableTwoFactor(userId, token);

    if (!result.verified) {
      return res.status(400).json(
        ApiError.badRequest(result.message)
      )
    }
    return res.status(200).json(
      ApiResponse.success(result.message)
    )

  })

  /**
   * GET /api/2fa/status
   * Check if 2FA is enabled
   */
  getTwoFactorStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const isEnabled = await this.twoFactorService.checkTwoFactorStatus(userId);

    res.status(200).json(
      ApiResponse.success(
        {
          twoFactorEnabled: isEnabled,
        }
      )
    );

  })
}