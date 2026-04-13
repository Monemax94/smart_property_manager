import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import passport from 'passport';
import { AuthService } from '../services/AuthService';
import { TYPES } from '../config/types';
import Jtoken from '../middleware/Jtoken';
import { AuthenticatedRequest, TokenType } from '../types/customRequest';
import { UserModel, UserRole, UserStatus } from '../models/User';
import { SessionService } from '../services/SessionService';
import { ActivityLogService } from '../services/ActivityLogService';
import { ActivityIcon, ActivityType, AlertLevel } from '../models/ActivityLog';
import { UserService } from '../services/UserService';
import TokenService from '../services/TokenService';
import { MailService } from '../services/MailService';
import { ProfileService } from '../services/ProfileService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import loggers from '../utils/loggers';
import oauthConfig from '../config/oauth.config';
import { GOOGLE_CLIENT_ID, FRONTEND_URL, ADMIN_DASH, MARKETING_FRONTEND_LINK } from '../secrets';
import Profile from '../models/Profile';
import { GoogleAuthService } from '../services/google.auth.service';
import { decryptData, encryptData } from '../utils/encryption';
import JwtAuth from "../middleware/Jtoken"
import { IUserRepository } from '../interfaces/IUserRepository';
import crypto from 'crypto';
@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.UserService) private userService: UserService,
    @inject(TYPES.ProfileService) private profileService: ProfileService,
    @inject(TYPES.MailService) private mailService: MailService,
    @inject(TYPES.TokenService) private tokenService: TokenService,
    @inject(TYPES.ActivityLogService) private activityService: ActivityLogService,
    @inject(TYPES.UserRepository) private userRepo: IUserRepository,
    @inject(TYPES.GoogleAuthService) private googleAuthService: GoogleAuthService,
    @inject(TYPES.SessionService) private sessionService: SessionService
  ) { }

  checkUser = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        ApiError.badRequest('Email address is required')
      );
    }

    const user = await this.userService.getUserByEmail(email);

    if (user) {
      return res.status(400).json(
        ApiError.badRequest('User already exists')
      )
    }

    await this.tokenService.sendVerificationToken(null, email);

    return res.json(new ApiResponse(200, { email }, 'Verification token sent to email'));
  });

  sendRecoveryEmailToken = asyncHandler(async (req: Request, res: Response) => {
    const { recoveryEmail } = req.body;

    if (!recoveryEmail) {
      throw ApiError.badRequest('Recovery email address is required');
    }

    await this.tokenService.sendVerificationToken(null, recoveryEmail);

    res.json(new ApiResponse(200, { recoveryEmail }, 'Verification token sent to recovery email'));
  });

  verify = asyncHandler(async (req: Request, res: Response) => {
    const { email, token } = req.body;

    if (!email || !token) {
      throw ApiError.badRequest('Email and token are required');
    }
    await this.authService.verifyUser(email, token);

    res.json(new ApiResponse(200, null, 'Email verified successfully'));
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, ...value } = req.body;

    if (!value.email) {
      return res.status(400).json(
        ApiError.badRequest('Email is required')
      )
    }

    const validateTokenVerification = await this.tokenService.getUsedTokenForUser(value.email);

    if (!validateTokenVerification) {
      return res.status(400).json(
        ApiError.badRequest('Please complete token validation for your account')
      )
    }
    const user = await this.authService.register(value);
    await this.profileService.updateProfileByUserId(user._id.toString(), { firstName, lastName });

    if (!user) {
      return res.status(500).json(
        ApiError.internal('User registration failed')
      )
    }

    await this.tokenService.deleteToken(value.email);

    if (user.activityLog.length < 1 && user.role === UserRole.VENDOR) {
      this.mailService.vendorWelcome(
        user.email,
        firstName,
        "Welcome to Smart Home",
        MARKETING_FRONTEND_LINK,
      )
    }
    if (user.activityLog.length < 1 && user.role === UserRole.CUSTOMER) {
      this.mailService.WelcomeBuyer(
        user.email,
        firstName,
        "Welcome to Smart Home",
        FRONTEND_URL,
      )
    }

    await this.activityService.logActivity({
      title: 'User Registration',
      description: `${user.email} registered on the platform`,
      activityType: ActivityType.CUSTOMER_REGISTRATION,
      user: user._id,
      metadata: {
        alertLevel: AlertLevel.SUCCESS,
      },
      icon: ActivityIcon.USER_PLUS
    });
    return res.status(201).json(ApiResponse.created({ success: true }, 'Registration successful'));
  });

  registerVendor = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, dob, ...value } = req.body;

    if (!value.email) {
      return res.status(400).json(
        ApiError.badRequest('Email is required')
      )
    }

    const validateTokenVerification = await this.tokenService.getUsedTokenForUser(value.email);
    if (!validateTokenVerification) {
      return res.status(400).json(
        ApiError.badRequest('Please complete token validation for your account')
      )
    }


    const user = await this.authService.register({ ...value, role: UserRole.VENDOR });
    await this.profileService.updateProfileByUserId(user._id.toString(), { firstName, lastName, dob });

    if (!user) {
      return res.status(500).json(
        ApiError.internal('User registration failed')
      )
    }

    await this.tokenService.deleteToken(value.email);
    if (user.activityLog.length < 1 && user.role === UserRole.VENDOR) {
      this.mailService.vendorWelcome(
        user.email,
        firstName,
        "Welcome to Smart Home",
        // ADMIN_DASH,
        MARKETING_FRONTEND_LINK
      )
    }
    if (user.activityLog.length < 1 && user.role === UserRole.CUSTOMER) {
      this.mailService.WelcomeBuyer(
        user.email,
        firstName,
        "Welcome to Smart Home",
        FRONTEND_URL,
      )
    }
    await this.activityService.logActivity({
      title: 'Vendor Registration',
      description: `${user.email} registered on the platform`,
      activityType: ActivityType.CUSTOMER_REGISTRATION,
      user: user._id,
      metadata: {
        alertLevel: AlertLevel.SUCCESS,
      },
      icon: ActivityIcon.USER_PLUS
    });
    return res.status(201).json(ApiResponse.created({ success: true }, 'Registration successful'));
  });

  registerAgent = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, dob, ...value } = req.body;

    if (!value.email) {
      return res.status(400).json(
        ApiError.badRequest('Email is required')
      )
    }

    const validateTokenVerification = await this.tokenService.getUsedTokenForUser(value.email);
    if (!validateTokenVerification) {
      return res.status(400).json(
        ApiError.badRequest('Please complete token validation for your account')
      )
    }

    const user = await this.authService.register({ ...value, role: UserRole.AGENT });
    await this.profileService.updateProfileByUserId(user._id.toString(), { firstName, lastName, dob });

    if (!user) {
      return res.status(500).json(
        ApiError.internal('User registration failed')
      )
    }

    await this.tokenService.deleteToken(value.email);
    await this.activityService.logActivity({
      title: 'Agent Registration',
      description: `${user.email} registered on the platform as an agent`,
      activityType: ActivityType.CUSTOMER_REGISTRATION,
      user: user._id,
      metadata: {
        alertLevel: AlertLevel.SUCCESS,
      },
      icon: ActivityIcon.USER_PLUS
    });
    return res.status(201).json(ApiResponse.created({ success: true }, 'Agent registration successful'));
  });

  registerFinalization = asyncHandler(async (req: Request, res: Response) => {
    const { email, ...others } = req.body;

    if (!email) {
      return res.status(400).json(
        ApiError.badRequest('Email is required')
      )
    }
    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json(
        ApiError.notFound('User does not exist')
      )
    }

    const userUpdated = await this.userService.updateUserInfo(user._id, { email, ...others });

    if (!userUpdated) {
      return res.status(500).json(
        ApiError.internal('Failed to update user information')
      )
    }

    const { password, securityAnswer, hint, ...safeUser } = userUpdated.toObject();
    return res.json(new ApiResponse(200, { user: safeUser }, 'User information updated successfully'));
  });

  registerSecurityQuestions = asyncHandler(async (req: Request, res: Response) => {
    const { email, ...others } = req.body;
    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json(ApiError.notFound('User does not exist'))
    }

    const userUpdated = await this.userService.updateUserInfo(user._id, { ...others });

    if (!userUpdated) {
      return res.status(500).json(ApiError.internal('Failed to update user information'))
    }
    const { password, securityAnswer, hint, ...safeUser } = userUpdated.toObject();

    return res.json(new ApiResponse(200, { user: safeUser }, 'Security information updated successfully'));
  });

  registerSecurityInfo = asyncHandler(async (req: Request, res: Response) => {
    const { email, token, recoveryEmail, ...others } = req.body;

    if (!email || !token || !recoveryEmail) {
      return res.status(400).json(ApiError.badRequest('Email, token, and recovery email are required'))
    }

    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json(ApiError.notFound('User does not exist'))
    }

    await this.authService.verifyUser(recoveryEmail, token);

    const tokenUsed = await this.tokenService.getUsedTokenForUser(recoveryEmail, false);
    if (!tokenUsed) {
      return res.status(400).json(ApiError.badRequest('No valid token found'))
    }

    if (tokenUsed.token != token) {
      return res.status(400).json(ApiError.badRequest('Invalid or incorrect token'))
    }

    const userUpdated = await this.userService.updateUserInfo(user._id, { email, recoveryEmail, ...others });

    if (!userUpdated) {
      return res.status(500).json(ApiError.internal('Failed to update user information'))
    }

    await this.tokenService.deleteToken(recoveryEmail);

    const { password, securityAnswer, hint, ...safeUser } = userUpdated.toObject();

    return res.json(ApiResponse.success({ user: safeUser }, 'Security information updated successfully'));
  });

  registerAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json(ApiError.forbidden('Only super admin can register an admin'))
    }

    const user = await this.authService.register({ ...req.body, role: UserRole.ADMIN });

    if (!user) {
      return res.status(500).json(ApiError.internal('Admin registration failed'))
    }

    await this.activityService.logActivity({
      title: 'New Admin Registration',
      description: `${user.email} registered on the platform`,
      activityType: ActivityType.ADMIN_REGISTRATION,
      user: req.user._id,
      icon: ActivityIcon.USER_PLUS,
    });

    return res.status(201).json(ApiResponse.created({ user }, 'Admin registration successful'));
  });


  registerVendorFully = asyncHandler(async (req: Request, res: Response) => {
    const {
      email,
      phoneNumber,
      password,
      storeName,
      storeDescription,
      taxId,
      address,
      website,
      categories,
      uploadedFiles
    } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const getFilesByDocumentName = (name: string) =>
      uploadedFiles?.filter((f: any) => f.documentName?.includes(name)) || [];

    const user = await this.authService.register(
      { email, phoneNumber, password },
      {
        storeName,
        storeDescription,
        taxId,
        address,
        website,
        categories,
        logo: getFilesByDocumentName('storeLogo'),
        businessRegistrationFiles: getFilesByDocumentName('businessRegistration'),
        vendorNINFiles: getFilesByDocumentName('vendorNIN')
      }
    );

    if (!user) {
      throw ApiError.internal('Vendor registration failed');
    }

    await this.activityService.logActivity({
      title: 'New Vendor Registration',
      description: `${user.email} registered on the platform`,
      activityType: ActivityType.VENDOR_REGISTRATION,
      user: user._id,
      icon: ActivityIcon.USER_PLUS,
    });

    res.status(201).json(new ApiResponse(201, { user }, 'Vendor registered successfully'));
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(ApiError.badRequest('Email and password are required'));
    }

    const userLogged = await this.authService.login(email, password);
    const { password: pass, ...user } = userLogged.toJSON();

    const jtoken = new Jtoken();
    const { accessToken, refreshToken } = await jtoken.createToken({
      email: user.email,
      role: user.role,
      _id: user._id.toString()
    });

    const [wallet] = await Promise.all([
      this.sessionService.handleUserLogin(
        userLogged._id,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || 'unknown',
          token: refreshToken,
        }
      ),
      this.activityService.logActivity({
        title: 'User Login',
        description: `${userLogged.email} logged in to the platform`,
        activityType: ActivityType.LOGIN,
        user: userLogged._id,
      })
    ]);
    return res.json(new ApiResponse(200, {
      user: { ...user, online: true, status: UserStatus.ACTIVE },
      wallet,
      accessToken,
      refreshToken
    }, 'Login successful'));
  });

  getEmailAttachToRecoveryEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(ApiError.badRequest('Recovery email is required'));
    }

    const users = await this.userService.getUsersByRecoveryEmail(email);

    if (!users || users.length === 0) {
      throw ApiError.notFound('No accounts found with this recovery email');
    }

    const attachedEmails = users.map(user => ({
      email: user.email,
      userID: user.userID
    }));

    res.json(new ApiResponse(200, {
      count: attachedEmails.length,
      accounts: attachedEmails
    }, 'Accounts found successfully'));
  });

  sendTokenForEmailRecovery = asyncHandler(async (req: Request, res: Response) => {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      throw ApiError.badRequest('Email is required');
    }

    if (!firstName || !lastName) {
      throw ApiError.badRequest('First name and last name are required');
    }

    // Get users with profile populated
    const users = await this.userService.getUsersByRecoveryEmail(email);

    if (!users || users.length === 0) {
      throw ApiError.notFound('No accounts found with this recovery email');
    }

    // Check that at least one user's profile matches (even if first/last name are swapped)
    const matchedUser = users.find((user) => {
      if (!user.profile) return false;

      const dbFirst = user.profile.firstName?.toLowerCase();
      const dbLast = user.profile.lastName?.toLowerCase();
      const inputFirst = firstName.toLowerCase();
      const inputLast = lastName.toLowerCase();

      return (
        (dbFirst === inputFirst && dbLast === inputLast) || // Normal match
        (dbFirst === inputLast && dbLast === inputFirst)   // Swapped match
      );
    });

    if (!matchedUser) {
      throw ApiError.badRequest(
        'First name and last name do not match any account with this recovery email'
      );
    }

    // Create token linked to recovery email
    const token = await this.tokenService.createVerificationToken(
      TokenType.ACCOUNT_RECOVERY,
      null,
      email
    );

    await this.mailService.accountRecovery(email, token, users[0].profile.firstName?.toLowerCase());

    res.json(new ApiResponse(200, null, 'Recovery token sent to email'));
  });

  validateTokenEmailRecovery = asyncHandler(async (req: Request, res: Response) => {
    const { token, email } = req.body;

    if (!email || !token) {
      return res.status(400).json(ApiError.badRequest('Email and token are required'))
    }

    const tokenValid = await this.tokenService.validateToken(token, email);

    if (!tokenValid) {
      return res.status(400).json(ApiError.badRequest('Invalid token'))
    }


    const users = await this.userService.getUsersByRecoveryEmail(email);

    if (!users || users.length === 0) {
      return res.status(400).json(ApiError.notFound('No accounts found with this recovery email'))
    }


    const attachedEmails = users.map(user => ({
      email: user.email,
      userID: user.userID
    }));

    // delete the token
    await this.tokenService.deleteToken(email)

    return res.json(new ApiResponse(200, {
      count: attachedEmails.length,
      accounts: attachedEmails
    }, 'Token validated successfully'));
  });

  sendReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(ApiError.badRequest('Email is required'))
    }

    const user = await this.authService.sendResetToken(email);

    await this.activityService.logActivity({
      title: 'Password Reset Request',
      description: `${user?.email} requested password reset`,
      activityType: ActivityType.PASSWORD_RESET,
      user: user?._id
    });

    return res.json(ApiResponse.success({
      hasSecurityQuestion: Boolean(user?.securityQuestion),
      hasRecoveryEmail: Boolean(user?.recoveryEmail),
      hint: user?.hint,
      securityQuestion: user?.securityQuestion,
    }, 'Reset token sent to email'));
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, token, newPassword, securityAnswer } = req.body;

    if (!email || !token || !newPassword) {
      throw ApiError.badRequest('Email, token, and new password are required');
    }

    await this.authService.resetPassword(email, token, newPassword, securityAnswer);

    return res.json(new ApiResponse(200, null, 'Password reset successful'));
  });

  resendResetToken = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email ) {
      return res.status(400).json(ApiError.badRequest('Email is required'))
    }

    const userExist = await this.userService.getUserByEmail(email);

    if (!userExist) {
      return res.status(400).json(ApiError.notFound('User does not exist'))
    }
    // let tokenValid;
    const tokenExist = await this.tokenService.getUnusedTokenForResend(email, false)
    if(!tokenExist){
      // resend
      return res.json(ApiError.internal( 'Failed resending token')); 
    }
    const profile = await this.profileService.findUserById(userExist?._id.toString())
    await this.mailService.sendPasswordReset(email, tokenExist.token, profile);
    return res.json(ApiResponse.success({
      hasSecurityQuestion: Boolean(userExist?.securityQuestion),
      hasRecoveryEmail: Boolean(userExist?.recoveryEmail),
      hint: userExist?.hint,
      securityQuestion: userExist?.securityQuestion,
    }, 'Token Resend'));

  });
  tokenValidation = asyncHandler(async (req: Request, res: Response) => {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json(ApiError.badRequest('Email and token are required'))
    }

    const userExist = await this.userService.getUserByEmail(email);

    if (!userExist) {
      return res.status(400).json(ApiError.notFound('User does not exist'))
    }

    const tokenValid = await this.tokenService.validateToken(token.toString(), email);

    return res.json(ApiResponse.success({
      tokenValid,
      hasRecoveryEmail: Boolean(userExist?.recoveryEmail),
      hasSecurityQuestion: Boolean(userExist?.securityQuestion),
      hint: userExist?.hint,
      securityQuestion: userExist?.securityQuestion,
    }, 'Token validation completed'));
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.token || req.cookies.refreshToken;

    if (!refreshToken) {
      throw ApiError.badRequest('Refresh token is required');
    }

    const result = await this.authService.logout(refreshToken);

    res.json(new ApiResponse(200, { userId: result.userId }, 'Logout successful'));
  });
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.token;

    if (!refreshToken) {
      return res.status(400).json(ApiError.badRequest('Refresh token is required'))
    }

    const jtoken = new Jtoken();
    const refreshResult = await jtoken.refreshAccessToken(refreshToken);

    if (!refreshResult) {
      return res.status(403).json(ApiError.unauthorized("Invalid or expired refresh token"))
    }

    // Return the new access token and user data
    return res.status(200).json(
      ApiResponse.success(
        {
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
          user: refreshResult.user
        },
        "Token refreshed successfully"
      )
    );
  });

  /**
   * Google login using ID token
  */
  verifyGoogleToken = asyncHandler(async (req: Request, res: Response) => {

    const { code } = req.body;
    if (!code) {
      return res.status(400).send("Missing authorization code");
    }
    try {
      // Exchange authorization code for tokens
      const { tokens } = await oauthConfig.getToken(code);
      oauthConfig.setCredentials(tokens);
      const tokenId = tokens.id_token;

      if (!tokenId) {
        return res.status(403).json(ApiError.unauthorized("Failed to get token from Google during code exchange"))
      }

      const ticket = await oauthConfig.verifyIdToken({
        idToken: tokenId,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, name, picture, id: googleId, given_name, family_name } = payload as any;
      if (!email) throw ApiError.unauthorized("Invalid Google token: missing email");

      // Find or create user
      let user = await this.userService.getUserByEmail(email);
      if (!user) {
        // create profile
        let profile = await Profile.create(
          {
            firstName: given_name,
            lastName: family_name,
            photo: [{
              url: picture,
              format: this.extractExtension(picture),
              fileSize: 1024,
              fileType: this.extractExtension(picture),
              imageName: "profile image",
              documentName: "profile"
            }]
          }
        )
        //connect the profile to a user
        user = new UserModel(
          {
            email,
            googleId,
            verified: true,
            status: UserStatus.ACTIVE,
            role: UserRole.CUSTOMER,
            profile: profile._id
          }
        );
        user.save()
      }
      const jtoken = new Jtoken();
      const { accessToken, refreshToken } = await jtoken.createToken({
        email: user.email,
        role: user.role,
        _id: user._id.toString()
      });
      const { password, securityAnswer, ...safeUser } = user.toObject();

      // const sessionInfo = await user.addLoginSession(req.ip, req.headers['user-agent']);
      return res.status(200).json({
        status: true,
        message: 'Google Login successful',
        user: safeUser,
        accessToken,
        refreshToken
      });
    } catch (error: any) {
      loggers.error("Google auth error:", error);
      return res.status(error.statusCode || 400).json(
        ApiError.badRequest(error.message || "Google authentication failed")
      );
    }
  })

  /**
  * Initiate Google OAuth flow
  */
  authenticate = (req: Request, res: Response, next: any) => {
    // Get redirect URLs from query
    const { successRedirect, failureRedirect, platform } = req.query;
    if (!successRedirect || !failureRedirect) {
      return res.status(400).json(
        ApiError.badRequest("both successRedirect and failureRedirect are required",
          {
            successRedirect: "required",
            failureRedirect: "required"
          }
        )
      )
    }

    const state = encodeURIComponent(
      JSON.stringify({
        successRedirect: encodeURIComponent(successRedirect as string),
        failureRedirect: encodeURIComponent(failureRedirect as string),
        platform: typeof platform === 'string' ? platform : 'web',
      })
    );

    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      state,
    })(req, res, next);
  };

  /**
   * Handle Google OAuth callback (Universal)
   */
  handleCallback = (req: Request, res: Response, next: any) => {
    passport.authenticate(
      'google',
      { session: false },
      async (err: any, user: any) => {
        let state: any = {};
        // Safe decoding for state param
        if (req.query.state) {
          try {
            const decoded = decodeURIComponent(req.query.state as string);
            state = JSON.parse(decoded);
          } catch (e) {
            loggers.warn("Malformed Google OAuth state parameter:", req.query.state, e);
            state = {};
          }
        }

        // Decode the inner redirect URLs
        const successRedirect = state.successRedirect
          ? decodeURIComponent(state.successRedirect)
          : `${FRONTEND_URL}/auth/success`;

        const failureRedirect = state.failureRedirect
          ? decodeURIComponent(state.failureRedirect)
          : `${FRONTEND_URL}/login?error=google_auth_failed`;

        const platform = state.platform || 'web';

        try {
          if (err || !user) {
            loggers.error('Google auth error:', err);
            return res.redirect(failureRedirect);
          }

          // Generate access token
          const accessToken = await this.googleAuthService.generateTokens(user);
          const encryptedToken = encryptData(accessToken.toString());

          // Redirect to success URL (appScheme or web)
          return res.redirect(`${successRedirect}?accessToken=${encryptedToken}`);
        } catch (error: any) {
          loggers.error('Error in Google callback:', error);
          return res.redirect(failureRedirect);
        }
      }
    )(req, res, next);
  }

  getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body
    if (!token) {
      return res.status(401).json(
        ApiError.unauthorized("Invalid user token")
      )
    }
    const decoded = await new Jtoken().verifyToken(decryptData(token));

    const userData = await this.userRepo.findByEmail(decoded.email);
    if (!userData) {
      return res.status(400).json(
        ApiError.notFound("User not found")
      )
    }
    // Update user status to active
    userData.status = UserStatus.ACTIVE;
    userData.isActive = true;
    await userData.save();

    // Generate app tokens
    const tokenPayload = {
      _id: userData._id.toString(),
      role: userData.role,
      email: userData.email,
    };
    const { password, securityAnswer, ...safeUser } = userData.toObject();
    // Generate tokens
    const { accessToken, refreshToken } = await new JwtAuth().createToken(tokenPayload);
    const [sess] = await Promise.all([
      this.sessionService.handleUserLogin(
        userData._id,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || 'unknown',
          token: refreshToken,
        }
      ),
      this.activityService.logActivity({
        title: 'User Login',
        description: `${userData.email} logged in to the platform`,
        activityType: ActivityType.LOGIN,
        user: userData._id,
      })
    ]);
    // Return tokens + user data
    return res.status(200).json(
      ApiResponse.success({
        message: "Google login successful",
        user: { ...safeUser, online: true, status: UserStatus.ACTIVE, isActive: true },
        accessToken,
        refreshToken,
      })
    );
  })

  extractExtension = (filename) => {
    // Find the position of the last dot
    const lastDotIndex = filename.lastIndexOf('.');

    // Check if a dot was found and it's not the very first character
    if (lastDotIndex !== -1 && lastDotIndex < filename.length - 1) {
      // Extract the substring starting one character after the last dot
      return filename.substring(lastDotIndex + 1);
    } else {
      return '';
    }
  }

}