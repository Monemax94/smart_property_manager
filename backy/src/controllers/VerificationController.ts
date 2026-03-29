import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/customRequest';
import VerificationRequestModel from '../models/VerificationRequest';
import { UserModel, UserRole } from '../models/User';

export const applyForLandlord = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { roleRequested, address, ninSlip } = req.body;

    // Check if an existing pending request exists
    const existingRequest = await VerificationRequestModel.findOne({ user: userId, status: 'pending' });
    if (existingRequest) {
      res.status(400).json({ success: false, message: 'You already have a pending verification request.' });
      return;
    }

    const application = new VerificationRequestModel({
      user: userId,
      roleRequested: roleRequested || 'landlord',
      address,
      ninSlip
    });

    await application.save();

    // Optionally notify SuperAdmin using a notification system or email service here
    // ...

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. Our support team will review your request.',
      data: application
    });
  } catch (error) {
    console.error('Apply for landlord error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application. Please try again.' });
  }
};

export const approveApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Only allow for superadmin / admin? Let's assume there's a middleware doing this, or verify here:
    // Actually we will wrap this with admin middleware in routes.

    const application = await VerificationRequestModel.findById(id);
    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    if (application.status !== 'pending') {
      res.status(400).json({ success: false, message: 'Application is already finalized.' });
      return;
    }

    application.status = 'approved';
    await application.save();

    const userToUpdate = await UserModel.findById(application.user);
    if (userToUpdate) {
      userToUpdate.role = UserRole.ADMIN; // Based on requirements: "makes the user an Admin to list a property"
      userToUpdate.verified = true;
      await userToUpdate.save();
    }

    res.status(200).json({
      success: true,
      message: 'Application approved successfully.',
      data: application
    });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve application.' });
  }
};

// Also add a route to get applications or user's application status...
export const getMyApplicationStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const application = await VerificationRequestModel.findOne({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Get application status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get application status.' });
  }
};
