import { Response, NextFunction } from 'express';
import { container } from '../config/inversify.config';
import Jtoken from './Jtoken';
import { UserRepository } from '../repositories/UserRepository';
import { ActionType, UserModel, UserRole } from '../models/User';
import { AuthenticatedRequest } from '../types/customRequest';
import { SessionService } from '../services/SessionService';
import { TYPES } from '../config/types';
import { AddressModel } from '../models/Address';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import VendorModel from '../models/Vendor';


const activityService = container.get<SessionService>(TYPES.SessionService);
const tokenService = new Jtoken();
const userRepository = new UserRepository(UserModel, AddressModel);

export const authenticate = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Extract token
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json(  ApiError.unauthorized('Authentication required'));
  }

  const token = header.replace('Bearer ', '').trim();
  
  // Verify & decode
  const payload = await tokenService.verifyToken(token);
  if (!payload) {
    return res.status(401).json(  ApiError.unauthorized('Invalid or expired token'));
  }

  // Fetch user by ID
  const user = await userRepository.findById(payload._id);
  if (!user) {
    return res.status(401).json(  ApiError.unauthorized('User not found'));
  }

  // Check account status
  if (!user.isActive || user.isDeleted) {
    return res.status(403).json(  ApiError.forbidden('Account is not active'));
  }

  // Update activity tracking
  await activityService.updateUserActivity(
    user._id,
    ActionType.AUTHENTICATE,
    req.path,
    {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  );

  // Attach to request and proceed
  req.user = user;
  next();
});

// Role authorization middleware
export const authorize = (requiredRoles: UserRole[]) => {
  return asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json( 
        ApiError.unauthorized('Authentication required')
      )
    }

    // Check if user has at least one of the required roles
    if (!requiredRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      await activityService.updateUserActivity(
        req.user._id,
        ActionType.UNAUTHORIZED_ACCESS_ATTEMPT,
        req.path,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      );
      
      return res.status(403).json(  ApiError.forbidden(`Access restricted to: ${requiredRoles.join(', ')}`));
    }
    // if (req.user.role === UserRole.VENDOR) {
    //   const hasVendor = await VendorModel.exists({
    //     user: req.user._id,
    //     verified: true
    //   });
    
    //   if (!hasVendor) {
    //     throw ApiError.forbidden(
    //       'Vendor account not yet verified. Kindly await confirmations'
    //     );
    //   }
    // }

    // Log successful authorization
    await activityService.updateUserActivity(
      req.user._id,
      ActionType.AUTHORIZED_ACCESS,
      req.path
    );

    next();
  });
};

//  Create a middleware factory for specific roles
export const requireRoles = (roles: UserRole[]) => authorize(roles);

// Pre-defined role-based middlewares
export const requireAdmin = authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
export const requireVendor = authorize([UserRole.VENDOR]);
export const requireCustomer = authorize([UserRole.CUSTOMER]);
export const requireSuperAdmin = authorize([UserRole.SUPER_ADMIN]);