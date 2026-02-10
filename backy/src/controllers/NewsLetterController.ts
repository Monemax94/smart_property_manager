import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '../config/types';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { AuthenticatedRequest } from '../types/customRequest';
import { NewsLetterService } from '../services/NewsLetterService';


@injectable()
export class NewsLetterController {
  constructor(
    @inject(TYPES.NewsLetterService)
    private service: NewsLetterService
  ) { }

  // Subscribe to organization newsletter
  subscribe = asyncHandler(async (req: AuthenticatedRequest, res: Response) =>{
    try {
      const { email, preferences, organization } = req.body;
      const userId = req.user?._id.toString();

      const subscription = await this.service.subscribe({
        email,
        userId,
        organization, // Organization ID or slug
        preferences
      });

      return res.status(200).json({
        message: `Successfully subscribed to our newsletter. A confirmation email has been sent.`,
        data: {
          email: subscription.email,
          organization: subscription.organization,
          preferences: subscription.preferences,
          subscribedAt: subscription.subscribedAt
        }
      });

    } catch (error: any) {
      if (error.message === 'Email is already subscribed to this organization\'s newsletter') {
        return res.status(409).json({
          message: error.message
        });
      }

      if (error.message === 'Organization not found') {
        return res.status(404).json({
          message: error.message
        });
      }

      console.error('Newsletter subscription error:', error);
      return res.status(500).json({
        message: 'Failed to subscribe to newsletter'
      });
    }
  })

  // Unsubscribe from organization newsletter
  unsubscribe = asyncHandler(async (req: Request, res: Response) =>{
    try {
      const { email, organization } = req.body;

      const result = await this.service.unsubscribe(email, organization);

      if (!result) {
        return res.status(404).json({
          message: 'Subscription not found for this organization'
        });
      }

      return res.status(200).json({
        message: 'Successfully unsubscribed from newsletter'
      });

    } catch (error: any) {
      if (error.message === 'Organization not found') {
        return res.status(404).json({
          message: error.message
        });
      }

      console.error('Newsletter unsubscribe error:', error);
      return res.status(500).json({
        message: 'Failed to unsubscribe from newsletter'
      });
    }
  })

  // Get subscription status for organization
  getStatus =  asyncHandler(async (req: Request, res: Response) =>{
    try {
      const email = req.query.email as string;
      const organization = req.query.organization as string;

      if (!email || !organization) {
        return res.status(400).json(
          ApiError.badRequest('Email and organization query parameters are required')
        );
      }

      const subscription = await this.service.getSubscription(email, organization);
      return res.status(200).json({
        data: {
          isSubscribed: subscription?.isActive || false,
          email: subscription?.email || email,
          organization: subscription?.organization,
          preferences: subscription?.preferences,
          subscribedAt: subscription?.subscribedAt,
          unsubscribedAt: subscription?.unsubscribedAt
        }
      });

    } catch (error: any) {
      if (error.message === 'Organization not found') {
        return res.status(404).json({
          message: error.message
        });
      }

      console.error('Get subscription status error:', error);
      return res.status(500).json({
        message: 'Failed to get subscription status'
      });
    }
  })

  // Update preferences for organization
  updatePreferences = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { preferences, email, organization } = req.body;

      if (!email || !organization) {
        return res.status(400).json({
          message: 'Email and organization are required'
        });
      }

      const subscription = await this.service.updatePreferences(
        email,
        organization,
        preferences
      );

      if (!subscription) {
        return res.status(404).json({
          message: 'Subscription not found for this organization'
        });
      }

      return res.status(200).json({
        message: 'Preferences updated successfully',
        data: {
          preferences: subscription.preferences
        }
      });

    } catch (error: any) {
      if (error.message === 'Organization not found') {
        return res.status(404).json({
          message: error.message
        });
      }

      console.error('Update preferences error:', error);
      return res.status(500).json({
        message: 'Failed to update preferences'
      });
    }
  })

  // Get active subscribers for organization
  getSubscribers = asyncHandler(async (req: Request, res: Response) =>{
    try {
      const organization = req.params.organization;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await this.service.getActiveSubscribers(organization, page, limit);

      return res.status(200).json({
        data: result.subscribers,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });

    } catch (error: any) {
      if (error.message === 'Organization not found') {
        return res.status(404).json({
          message: error.message
        });
      }
      console.error('Get subscribers error:', error);
      return res.status(500).json({
        message: 'Failed to get subscribers'
      });
    }
  })
}