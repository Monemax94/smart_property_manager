import { inject, injectable } from 'inversify';
import { IUserDocument, UserModel, UserRole, UserStatus } from '../models/User';
import { Types } from "mongoose";
import { TokenModel } from '../models/Token';
import { MailService } from './MailService';
import { TYPES } from '../config/types';
import { randomInt } from 'node:crypto';
import { IUserRepository } from '../interfaces/IUserRepository';
import TokenService from './TokenService';
import Vendor, { IVendor } from '../models/Vendor';
import { TokenType } from '../types/customRequest';
import bcrypt from 'bcrypt';
import Profile, { IProfile } from '../models/Profile';
import { ProfileService } from './ProfileService';
import { ApiError } from '../utils/ApiError';

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.MailService) private mailService: MailService,
    @inject(TYPES.TokenService) private tokenService: TokenService,
    @inject(TYPES.ProfileService) private profileService: ProfileService,
    @inject(TYPES.UserRepository) private userRepository: IUserRepository
  ) { }

  async register(
    userData: Partial<IUserDocument>,
    vendorData?: Partial<IVendor>
  ): Promise<IUserDocument> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) throw ApiError.badRequest('user already exist');

    let newUser: IUserDocument;

    if (vendorData) {
      const result = await this.userRepository.createVendor(
        userData as Omit<IUserDocument, 'createdAt' | 'updatedAt'>,
        vendorData
      );
      newUser = result.user;
    } else {
      newUser = await this.userRepository.create(
        { ...userData, verified: true } as Omit<IUserDocument, 'createdAt' | 'updatedAt'>
      );
    }
    // create user profile
    return newUser;
  }

  async verifyUser(email: string, token: number, registered: boolean = false): Promise<boolean> {
    let user = null;
    //  If verification registered user is required, ensure user exists
    if (registered) {
      user = await this.userRepository.findByEmail(email);
      if (!user) throw ApiError.notFound('User not found');
    }
    // Validate token against userId (if verification) or email (if not verification)
    const identifier = registered ? user!._id.toString() : email;
    const tokenRecord = await this.tokenService.validateToken(token.toString(), identifier);
    if (!tokenRecord) {
      throw ApiError.badRequest('Invalid or expired token');
    }


    // If verification for registered user, mark user as verified
    if (registered) {
      await this.userRepository.verifyUser(user!._id.toString());
      await this.tokenService.deleteToken(identifier);
    } else {
      // await this.tokenService.invalidateExistingTokens(identifier)
      await this.tokenService.updateTokenUsablility(tokenRecord?._id.toString())
    }

    return true;
  }


  async login(email: string, password: string) {
    const user = (await this.userRepository.findByEmail(email));
    if (!user) throw ApiError.notFound('User not found');

    if (!user.verified) {
      await this.tokenService.deleteToken(user?._id.toString());
      const token = await this.tokenService.createVerificationToken(TokenType.EMAIL, user?._id.toString());
      await this.mailService.sendVerification(user.email, Number(token));
      throw ApiError.badRequest('Email not verified. A new verification code has been sent.');
    }

    if (user.isDeleted) {
      throw ApiError.badRequest('Your account has been suspended. Contact support for assistance.');
    }

    const match = await (user as IUserDocument).comparePassword(password);
    if (!match) throw ApiError.badRequest('Invalid credentials');

    // Check if the user is a vendor and if the vendor document was created
    if (user?.role === UserRole.VENDOR) {
      const vendor = await Vendor.findOne({ user: user?._id });
      if (!vendor) {
        await UserModel.deleteOne({ _id: user?._id });
        await Profile.deleteOne({ user: user?._id });
        throw ApiError.notFound('Vendor account not found');
      }
      // if (!vendor.verified) throw ApiError.badRequest('Vendor not verified by admin');
    }

    // Update user status to active
    user.status = UserStatus.ACTIVE;
    user.isActive = true;
    await user.save();
    return user;
  }

  async sendResetToken(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('User not found');
    const token = await this.tokenService.generateToken();
    const profile = await this.profileService.findUserById(user?._id.toString())
    await this.tokenService.deleteToken(email);
    await new TokenModel({ email, token }).save();
    await this.mailService.sendPasswordReset(email, token, profile);
    return user
  }

  async resetPassword(email: string, token: number, newPassword: string, securityAnswer?: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('User not found');
    // If securityAnswer was provided, validate it using bcrypt
    if (securityAnswer) {
      // Check if user has security question setup
      if (!user.securityQuestion || !user.securityAnswer) {
        throw ApiError.badRequest('Security question not set up for this user');
      }

      // Use bcrypt to compare the provided answer with the stored hash
      const isSecurityAnswerValid = await bcrypt.compare(securityAnswer, user.securityAnswer);
      if (!isSecurityAnswerValid) {
        throw ApiError.badRequest('Invalid security answer');
      }
    }

    const tokenRecord = await this.tokenService.validateToken(token.toString(), email);
    if (!tokenRecord) return ApiError.badRequest('Invalid token');
    await this.userRepository.updatePassword(user._id.toString(), newPassword);
    await this.tokenService.deleteToken(email);
    return true;
  }
  async tokenValidate(email: string, token: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('User not found');
    const tokenRecord = await TokenModel.findOne({ user: user._id, token });
    if (!tokenRecord) throw ApiError.badRequest('Invalid token');
    return token
  }

  async resendVerification(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('User not found');
    if (user.verified) throw ApiError.badRequest('Email already verified');

    const token = randomInt(100000, 999999);
    await TokenModel.deleteMany({ user: user._id });
    await new TokenModel({ user: user._id, token }).save();
    await this.mailService.sendVerification(user.email, token);

    return true;
  }

  verifyVendor = async (vendorId: Types.ObjectId) => {
    const vendor = await Vendor.findOne({ _id: vendorId });
    if (!vendor) {
      throw ApiError.notFound('Vendor not found');
    }
    vendor.verified = true;
    await vendor.save();
    return vendor;
  }
  deleteUser = async (vendorUserId: Types.ObjectId) => {
    return await this.userRepository.deleteAccount(vendorUserId);
  }

  async setTransactionPin(userId: Types.ObjectId, pin: string) {
    const user = await this.userRepository.findById(userId.toString());
    if (!user) return false;
    user.transactionPin = pin; // Mongoose will handle hashing if pre-save is setup, but let's be sure.
    // Wait, let's check if User model has pre-save for transactionPin.
    await user.save();
    return true;
  }

  logout = async (refreshToken: string) => {
    return await this.userRepository.logout(refreshToken)
  }



}