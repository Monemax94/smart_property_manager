import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { PropertyService, CreatePropertyDTO, UpdatePropertyDTO } from '../services/PropertyService';
import { PropertySearchFilters, PaginationOptions } from '../repositories/PropertyRepository';
import { TYPES } from '../config/types';
import { AuthenticatedRequest } from '../types/customRequest';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';


@injectable()
export class PropertyController {
  constructor(
    @inject(TYPES.PropertyService) private propertyService: PropertyService
  ) { }

  /**
   * Create a new property
   * POST /api/properties
   */
  createProperty = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      /* #swagger.tags = ['Property'] */
      /* #swagger.summary = 'Create a new property' */

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const propertyData: CreatePropertyDTO = req.body;
      console.log("Creating property with data:", JSON.stringify(propertyData, null, 2));

      const property = await this.propertyService.createProperty(
        req.user.id || req.user._id.toString(),
        propertyData
      );

      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: property
      });
    } catch (error: any) {
      console.error("PropertyController.createProperty catch error:", error.message || error);
      next(error);
    }
  };

  /**
   * Get property by ID
   * GET /api/properties/:id
   */
  getPropertyById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      /* #swagger.tags = ['Property'] */
      /* #swagger.summary = 'Get property by ID' */

      const { id } = req.params;
      const incrementView = req.query.view === 'true';

      const property = await this.propertyService.getPropertyById(id, incrementView);

      res.status(200).json({
        success: true,
        data: property
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get property by slug
   * GET /api/properties/slug/:slug
   */
  getPropertyBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { slug } = req.params;
      const incrementView = req.query.view === 'true';

      const property = await this.propertyService.getPropertyBySlug(slug, incrementView);

      res.status(200).json({
        success: true,
        data: property
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search properties
   * GET /api/properties/search
   */
  searchProperties = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      /* #swagger.tags = ['Property'] */
      /* #swagger.summary = 'Search properties' */

      const filters: PropertySearchFilters = {
        propertyType: req.query.propertyType as any,
        propertySubType: req.query.propertySubType as string,
        listingType: req.query.listingType as any,
        city: req.query.city as string,
        state: req.query.state as string,
        country: req.query.country as string,

        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        priceType: req.query.priceType as any,

        minBedrooms: req.query.minBedrooms ? Number(req.query.minBedrooms) : undefined,
        maxBedrooms: req.query.maxBedrooms ? Number(req.query.maxBedrooms) : undefined,
        minBathrooms: req.query.minBathrooms ? Number(req.query.minBathrooms) : undefined,
        maxBathrooms: req.query.maxBathrooms ? Number(req.query.maxBathrooms) : undefined,
        minArea: req.query.minArea ? Number(req.query.minArea) : undefined,
        maxArea: req.query.maxArea ? Number(req.query.maxArea) : undefined,

        furnishingStatus: req.query.furnishingStatus as string,
        parkingSpots: req.query.parkingSpots ? Number(req.query.parkingSpots) : undefined,

        isFeatured: req.query.isFeatured === 'true',
        isPremium: req.query.isPremium === 'true',
        isVerified: req.query.isVerified === 'true',

        searchText: req.query.q as string,

        amenities: req.query.amenities
          ? (req.query.amenities as string).split(',')
          : undefined
      };

      const options: PaginationOptions = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await this.propertyService.searchProperties(filters, options);

      res.status(200).json({
        success: true,
        data: result.properties,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: options.limit
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update property
   * PUT /api/properties/:id
   */
  updateProperty = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      const updateData: UpdatePropertyDTO = req.body;

      const property = await this.propertyService.updateProperty(
        id,
        req.user.id,
        updateData
      );

      res.status(200).json({
        success: true,
        message: 'Property updated successfully',
        data: property
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete property
   * DELETE /api/properties/:id
   */
  deleteProperty = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;

      await this.propertyService.deleteProperty(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Property deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Publish property
   * POST /api/properties/:id/publish
   */
  publishProperty = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;

      const property = await this.propertyService.publishProperty(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Property published successfully',
        data: property
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark property as sold
   * POST /api/properties/:id/sold
   */
  markAsSold = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;

      const property = await this.propertyService.markAsSold(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Property marked as sold',
        data: property
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark property as rented
   * POST /api/properties/:id/rented
   */
  markAsRented = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;

      const property = await this.propertyService.markAsRented(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Property marked as rented',
        data: property
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get my properties
   * GET /api/properties/my-properties
   */
  getMyProperties = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const options: PaginationOptions = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20
    };

    const search = req.query.search as string;
    const status = req.query.status as any;
    const listingType = req.query.listingType as string;

    const result = await this.propertyService.getPropertiesByOwner(
      req.user._id.toString(),
      options,
      search,
      status,
      listingType
    );

    res.status(200).json(ApiResponse.paginated(result.properties, {
      total: result.total,
      page: options.page,
      limit: options.limit,
      pages: Math.ceil(result.total / (options.limit || 20))
    }, 'My properties retrieved successfully'));
  });

  /**
   * Get similar properties
   * GET /api/properties/:id/similar
   */
  getSimilarProperties = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? Number(req.query.limit) : 5;

      const properties = await this.propertyService.getSimilarProperties(id, limit);

      res.status(200).json({
        success: true,
        data: properties
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add to favorites
   * POST /api/properties/:id/favorite
   */
  addToFavorites = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;

      await this.propertyService.addToFavorites(id);

      res.status(200).json({
        success: true,
        message: 'Property added to favorites'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove from favorites
   * DELETE /api/properties/:id/favorite
   */
  removeFromFavorites = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;

      await this.propertyService.removeFromFavorites(id);

      res.status(200).json({
        success: true,
        message: 'Property removed from favorites'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get property statistics
   * GET /api/properties/statistics
   */
  getStatistics = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Use req.user._id as it's guaranteed by the authenticate middleware
    const ownerId = req.user?._id?.toString();

    if (!ownerId) {
      throw ApiError.unauthorized('Authentication required: User ID missing from session');
    }

    const stats = await this.propertyService.getStatistics(ownerId);

    res.status(200).json(ApiResponse.success(stats, 'Property statistics retrieved successfully'));
  });

  /**
   * Search properties near location
   * GET /api/properties/nearby
   */
  searchNearby = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const latitude = Number(req.query.lat);
      const longitude = Number(req.query.lng);
      const maxDistance = req.query.maxDistance
        ? Number(req.query.maxDistance)
        : 5000;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
        return;
      }

      const filters: Partial<PropertySearchFilters> = {
        propertyType: req.query.propertyType as any,
        listingType: req.query.listingType as any
      };

      const properties = await this.propertyService.searchNearby(
        latitude,
        longitude,
        maxDistance,
        filters,
        limit
      );

      res.status(200).json({
        success: true,
        data: properties
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get featured properties
   * GET /api/properties/featured
   */
  getFeaturedProperties = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const properties = await this.propertyService.getFeaturedProperties(limit);

      res.status(200).json({
        success: true,
        data: properties
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get premium properties
   * GET /api/properties/premium
   */
  getPremiumProperties = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const properties = await this.propertyService.getPremiumProperties(limit);

      res.status(200).json({
        success: true,
        data: properties
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Feature a property
   * POST /api/properties/:id/feature
   */
  featureProperty = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      const durationDays = req.body.durationDays || 30;

      const property = await this.propertyService.featureProperty(
        id,
        req.user.id,
        durationDays
      );

      res.status(200).json({
        success: true,
        message: 'Property featured successfully',
        data: property
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Make property premium
   * POST /api/properties/:id/premium
   */
  makePremium = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      const durationDays = req.body.durationDays || 30;

      const property = await this.propertyService.makePremium(
        id,
        req.user.id,
        durationDays
      );

      res.status(200).json({
        success: true,
        message: 'Property made premium successfully',
        data: property
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify property (Admin only)
   * POST /api/properties/:id/verify
   */
  verifyProperty = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;

      const property = await this.propertyService.verifyProperty(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Property verified successfully',
        data: property
      });
    } catch (error) {
      next(error);
    }
  };

  assignAgent = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { id } = req.params;
      const { agentId } = req.body;
      const property = await this.propertyService.assignAgent(id, req.user.id, agentId);
      res.status(200).json({ success: true, message: 'Agent assigned successfully', data: property });
    } catch (error) {
      next(error);
    }
  };

  scheduleMeet = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { id } = req.params;
      const { meetingDate } = req.body;
      const property = await this.propertyService.scheduleMeet(id, req.user.id, new Date(meetingDate));
      res.status(200).json({ success: true, message: 'Meeting scheduled', data: property });
    } catch (error) {
      next(error);
    }
  };
}