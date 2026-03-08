import { injectable } from 'inversify';
import { FilterQuery, UpdateQuery, Types } from 'mongoose';
import { PropertyModel, IProperty, PropertyStatus, PropertyType, ListingType } from '../models/Property';

export interface PropertySearchFilters {
  propertyType?: PropertyType;
  propertySubType?: string;
  listingType?: ListingType;
  status?: PropertyStatus;
  city?: string;
  state?: string;
  country?: string;

  // Price filters
  minPrice?: number;
  maxPrice?: number;
  priceType?: 'sale' | 'rent' | 'lease';

  // Feature filters
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minArea?: number;
  maxArea?: number;

  // Amenities
  amenities?: string[];

  // Additional filters
  furnishingStatus?: string;
  parkingSpots?: number;
  isFeatured?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;

  // Owner filter
  ownerId?: string;
  agentId?: string;

  // Text search
  searchText?: string;

  // Geo-location
  nearLocation?: {
    latitude: number;
    longitude: number;
    maxDistance: number; // in meters
  };
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@injectable()
export class PropertyRepository {

  /**
   * Create a new property
   */
  async create(propertyData: Partial<IProperty>): Promise<IProperty> {
    const property = new PropertyModel(propertyData);
    return await property.save();
  }

  /**
   * Find property by ID
   */
  async findById(id: string): Promise<IProperty | null> {
    return await PropertyModel.findById(id)
      .populate('addressId')
      .populate('ownerId', 'firstName lastName email phoneNumber')
      .populate('agentId', 'firstName lastName email phoneNumber')
      .exec();
  }

  /**
   * Find property by slug
   */
  async findBySlug(slug: string): Promise<IProperty | null> {
    return await PropertyModel.findOne({ slug })
      .populate('addressId')
      .populate('ownerId', 'firstName lastName email phoneNumber')
      .exec();
  }

  /**
   * Find multiple properties with filters
   */
  async find(
    filters: PropertySearchFilters,
    options: PaginationOptions = {}
  ): Promise<{ properties: IProperty[]; total: number; page: number; totalPages: number }> {
    const query = this.buildFilterQuery(filters);

    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    // Prioritize featured and premium
    if (!options.sortBy) {
      sort.isFeatured = -1;
      sort.isPremium = -1;
      sort.createdAt = -1;
    }

    const [properties, total] = await Promise.all([
      PropertyModel.find(query)
        .populate('addressId')
        .populate('ownerId', 'firstName lastName email phoneNumber')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      PropertyModel.countDocuments(query)
    ]);

    return {
      properties,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update property
   */
  async update(id: string, updateData: UpdateQuery<IProperty>): Promise<IProperty | null> {
    return await PropertyModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('addressId')
      .exec();
  }

  /**
   * Delete property (soft delete by changing status)
   */
  async softDelete(id: string): Promise<IProperty | null> {
    return await PropertyModel.findByIdAndUpdate(
      id,
      { status: PropertyStatus.INACTIVE },
      { new: true }
    ).exec();
  }

  /**
   * Hard delete property
   */
  async delete(id: string): Promise<IProperty | null> {
    return await PropertyModel.findByIdAndDelete(id).exec();
  }

  /**
   * Find properties by owner
   */
  async findByOwner(
    ownerId: string,
    options: PaginationOptions = {},
    search?: string,
    status?: PropertyStatus,
    listingType?: string
  ): Promise<{ properties: IProperty[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = { ownerId: new Types.ObjectId(ownerId) };

    if (status) query.status = status;
    if (listingType) query.listingType = listingType;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { propertySubType: { $regex: search, $options: 'i' } }
      ];
    }

    const [properties, total] = await Promise.all([
      PropertyModel.find(query)
        .populate('addressId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      PropertyModel.countDocuments(query)
    ]);

    return { properties, total };
  }

  /**
   * Find similar properties
   */
  async findSimilar(propertyId: string, limit: number = 5): Promise<IProperty[]> {
    const property = await PropertyModel.findById(propertyId);
    if (!property) return [];

    return await PropertyModel.find({
      _id: { $ne: propertyId },
      propertyType: property.propertyType,
      propertySubType: property.propertySubType,
      status: PropertyStatus.ACTIVE,
      'features.bedrooms': {
        $gte: (property.features.bedrooms || 0) - 1,
        $lte: (property.features.bedrooms || 0) + 1
      }
    })
      .populate('addressId')
      .limit(limit)
      .exec();
  }

  /**
   * Increment view count
   */
  async incrementViews(id: string): Promise<void> {
    await PropertyModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }

  /**
   * Increment favorites count
   */
  async incrementFavorites(id: string): Promise<void> {
    await PropertyModel.findByIdAndUpdate(id, { $inc: { favorites: 1 } });
  }

  /**
   * Decrement favorites count
   */
  async decrementFavorites(id: string): Promise<void> {
    await PropertyModel.findByIdAndUpdate(id, { $inc: { favorites: -1 } });
  }

  /**
   * Get property statistics
   */
  async getStatistics(ownerId?: string) {
    const matchStage: any = ownerId ? { ownerId: new Types.ObjectId(ownerId) } : {};

    const stats = await PropertyModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          featured: { $sum: { $cond: ['$isFeatured', 1, 0] } },
          premium: { $sum: { $cond: ['$isPremium', 1, 0] } },
          totalPrice: {
            $sum: {
              $cond: [
                { $gt: ['$pricing.rentPrice', 0] },
                '$pricing.rentPrice',
                { $ifNull: ['$pricing.salePrice', 0] }
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      featured: 0,
      premium: 0,
      totalPrice: 0
    };

    return {
      total: result.total,
      active: result.active,
      inactive: result.inactive,
      featured: result.featured,
      premium: result.premium,
      avgPrice: result.total > 0 ? Math.round(result.totalPrice / result.total) : 0
    };
  }

  /**
   * Search properties with geolocation
   */
  async findNearby(
    latitude: number,
    longitude: number,
    maxDistance: number = 5000, // meters
    filters: Partial<PropertySearchFilters> = {},
    limit: number = 20
  ): Promise<IProperty[]> {
    const query = this.buildFilterQuery(filters);

    return await PropertyModel.find({
      ...query,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      }
    })
      .populate('addressId')
      .limit(limit)
      .exec();
  }

  /**
   * Get featured properties
   */
  async getFeatured(limit: number = 10): Promise<IProperty[]> {
    return await PropertyModel.find({
      isFeatured: true,
      status: PropertyStatus.ACTIVE,
      featuredUntil: { $gte: new Date() }
    })
      .populate('addressId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get premium properties
   */
  async getPremium(limit: number = 10): Promise<IProperty[]> {
    return await PropertyModel.find({
      isPremium: true,
      status: PropertyStatus.ACTIVE,
      premiumUntil: { $gte: new Date() }
    })
      .populate('addressId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Build MongoDB filter query from search filters
   */
  private buildFilterQuery(filters: PropertySearchFilters): FilterQuery<IProperty> {
    const query: FilterQuery<IProperty> = {};

    if (filters.propertyType) {
      query.propertyType = filters.propertyType;
    }

    if (filters.propertySubType) {
      query.propertySubType = filters.propertySubType;
    }

    if (filters.listingType) {
      query.listingType = filters.listingType;
    }

    if (filters.status) {
      query.status = filters.status;
    } else {
      // Default to active properties
      query.status = PropertyStatus.ACTIVE;
    }

    // Price filters
    if (filters.minPrice || filters.maxPrice) {
      const priceField = filters.priceType === 'rent'
        ? 'pricing.rentPrice'
        : filters.priceType === 'lease'
          ? 'pricing.leasePrice'
          : 'pricing.salePrice';

      if (filters.minPrice) {
        query[priceField] = { ...query[priceField], $gte: filters.minPrice };
      }
      if (filters.maxPrice) {
        query[priceField] = { ...query[priceField], $lte: filters.maxPrice };
      }
    }

    // Feature filters
    if (filters.minBedrooms !== undefined) {
      query['features.bedrooms'] = { $gte: filters.minBedrooms };
    }
    if (filters.maxBedrooms !== undefined) {
      query['features.bedrooms'] = { ...query['features.bedrooms'], $lte: filters.maxBedrooms };
    }

    if (filters.minBathrooms !== undefined) {
      query['features.bathrooms'] = { $gte: filters.minBathrooms };
    }
    if (filters.maxBathrooms !== undefined) {
      query['features.bathrooms'] = { ...query['features.bathrooms'], $lte: filters.maxBathrooms };
    }

    if (filters.minArea !== undefined) {
      query['features.builtUpArea'] = { $gte: filters.minArea };
    }
    if (filters.maxArea !== undefined) {
      query['features.builtUpArea'] = { ...query['features.builtUpArea'], $lte: filters.maxArea };
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      query.amenities = { $all: filters.amenities };
    }

    // Furnishing status
    if (filters.furnishingStatus) {
      query['features.furnishingStatus'] = filters.furnishingStatus;
    }

    // Parking
    if (filters.parkingSpots !== undefined) {
      query['features.parkingSpots'] = { $gte: filters.parkingSpots };
    }

    // Boolean filters
    if (filters.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }
    if (filters.isPremium !== undefined) {
      query.isPremium = filters.isPremium;
    }
    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }

    // Owner/Agent filter
    if (filters.ownerId) {
      query.ownerId = new Types.ObjectId(filters.ownerId);
    }
    if (filters.agentId) {
      query.agentId = new Types.ObjectId(filters.agentId);
    }

    // Text search
    if (filters.searchText) {
      query.$text = { $search: filters.searchText };
    }

    return query;
  }

  /**
   * Bulk update properties
   */
  async bulkUpdate(ids: string[], updateData: UpdateQuery<IProperty>): Promise<number> {
    const result = await PropertyModel.updateMany(
      { _id: { $in: ids } },
      updateData
    );
    return result.modifiedCount;
  }

  /**
   * Check if property exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await PropertyModel.countDocuments({ _id: id });
    return count > 0;
  }
}