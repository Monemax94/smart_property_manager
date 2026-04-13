import { injectable, inject } from 'inversify';
import { Types } from 'mongoose';
import { PropertyRepository, PropertySearchFilters, PaginationOptions } from '../repositories/PropertyRepository';
import { IProperty, ListingType, OwnershipType, PropertyCondition, PropertyStatus, PropertySubType, PropertyType } from '../models/Property';
import { TYPES } from '../config/types';
import { ApiError } from '../utils/ApiError';



export interface CreatePropertyDTO {
  title: string;
  description: string;
  propertyType: PropertyType;  // Use enum instead of string
  propertySubType: PropertySubType;  // Use enum instead of string
  listingType: ListingType;  // Use enum instead of string
  ownerId: string;
  addressId: string;
  features: any;
  pricing: any;
  images: any[];
  videos?: any[];
  amenities?: string[];
  virtualTour?: string;
  yearBuilt?: number;
  propertyCondition?: PropertyCondition;  // Use enum
  ownershipType?: OwnershipType;  // Use enum
  location?: {
    coordinates: [number, number];
  };
  status?: PropertyStatus;
}

export interface UpdatePropertyDTO extends Partial<CreatePropertyDTO> {
  status?: PropertyStatus;
}

@injectable()
export class PropertyService {
  constructor(
    @inject(TYPES.PropertyRepository) private propertyRepository: PropertyRepository
  ) { }

  /**
   * Create a new property listing
   */
  async createProperty(userId: string, data: CreatePropertyDTO): Promise<IProperty> {
    console.log("Service: createProperty logic started", { ownerId: data.ownerId, userId });
    // Validate ownership
    if (data.ownerId !== userId) {
      console.warn("Service: Ownership validation failed", { data_owner: data.ownerId, userId });
      throw ApiError.forbidden('You can only create properties for yourself');
    }

    // Validate required fields
    if (!data.images || data.images.length === 0) {
      console.warn("Service: Images validation failed");
      throw ApiError.badRequest('At least one image is required');
    }

    const { location, ...restData } = data;

    // Set default values
    const propertyData: Partial<IProperty> = {
      ...restData,
      ownerId: new Types.ObjectId(userId),
      addressId: new Types.ObjectId(data.addressId),
      status: data.status || PropertyStatus.ACTIVE,
      views: 0,
      favorites: 0,
      inquiries: 0,
      shareCount: 0,
      availableFrom: new Date()
    };

    // Set location if coordinates provided
    if (data.location?.coordinates) {
      propertyData.location = {
        type: 'Point',
        coordinates: data.location.coordinates
      } as { type: 'Point'; coordinates: [number, number] };
    }

    const property = await this.propertyRepository.create(propertyData);
    return property;
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: string, incrementView: boolean = false): Promise<IProperty> {
    const property = await this.propertyRepository.findById(id);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    // Increment view count if requested
    if (incrementView && property.status === PropertyStatus.ACTIVE) {
      await this.propertyRepository.incrementViews(id);
    }

    return property;
  }

  /**
   * Get property by slug
   */
  async getPropertyBySlug(slug: string, incrementView: boolean = false): Promise<IProperty> {
    const property = await this.propertyRepository.findBySlug(slug);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    if (incrementView && property.status === PropertyStatus.ACTIVE) {
      await this.propertyRepository.incrementViews(property._id.toString());
    }

    return property;
  }

  /**
   * Search properties with filters
   */
  async searchProperties(
    filters: PropertySearchFilters,
    options: PaginationOptions = {}
  ) {
    return await this.propertyRepository.find(filters, options);
  }

  /**
   * Update property
   */
  async updateProperty(
    propertyId: string,
    userId: string,
    updateData: UpdatePropertyDTO
  ): Promise<IProperty> {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }
    // Check ownership
    const ownerId = (property.ownerId as any)._id?.toString() || property.ownerId.toString();
    if (ownerId !== userId) {
      throw ApiError.forbidden('You do not have permission to update this property');
    }

    // Prevent updating certain fields after property is sold/rented
    if ([PropertyStatus.SOLD, PropertyStatus.RENTED].includes(property.status)) {
      throw ApiError.badRequest('Cannot update sold or rented property');
    }

    const updated = await this.propertyRepository.update(propertyId, updateData);

    if (!updated) {
      throw ApiError.internal('Failed to update property');
    }

    return updated;
  }

  /**
   * Delete property
   */
  async deleteProperty(propertyId: string, userId: string): Promise<void> {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    // Check ownership
    const ownerId = (property.ownerId as any)._id?.toString() || property.ownerId.toString();
    if (ownerId !== userId) {
      throw ApiError.forbidden('You do not have permission to delete this property');
    }

    // Soft delete by changing status
    await this.propertyRepository.softDelete(propertyId);
  }

  /**
   * Publish property (change from draft to active)
   */
  async publishProperty(propertyId: string, userId: string): Promise<IProperty> {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    const ownerId = (property.ownerId as any)._id?.toString() || property.ownerId.toString();
    if (ownerId !== userId) {
      throw ApiError.forbidden('You do not have permission to publish this property');
    }

    if (property.status !== PropertyStatus.DRAFT) {
      throw ApiError.badRequest('Only draft properties can be published');
    }

    // Validate required fields before publishing
    this.validatePropertyForPublishing(property);

    const updated = await this.propertyRepository.update(propertyId, {
      status: PropertyStatus.ACTIVE,
      availableFrom: new Date()
    });

    if (!updated) {
      throw ApiError.internal('Failed to publish property');
    }

    return updated;
  }

  /**
   * Mark property as sold
   */
  async markAsSold(propertyId: string, userId: string): Promise<IProperty> {
    return await this.updatePropertyStatus(propertyId, userId, PropertyStatus.SOLD);
  }

  /**
   * Mark property as rented
   */
  async markAsRented(propertyId: string, userId: string): Promise<IProperty> {
    return await this.updatePropertyStatus(propertyId, userId, PropertyStatus.RENTED);
  }

  /**
   * Get properties by owner
   */
  async getPropertiesByOwner(ownerId: string, options: PaginationOptions = {}, search?: string, status?: PropertyStatus, listingType?: string) {
    return await this.propertyRepository.findByOwner(ownerId, options, search, status, listingType);
  }

  /**
   * Get similar properties
   */
  async getSimilarProperties(propertyId: string, limit: number = 5): Promise<IProperty[]> {
    return await this.propertyRepository.findSimilar(propertyId, limit);
  }

  /**
   * Add property to favorites
   */
  async addToFavorites(propertyId: string): Promise<void> {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    await this.propertyRepository.incrementFavorites(propertyId);
  }

  /**
   * Remove property from favorites
   */
  async removeFromFavorites(propertyId: string): Promise<void> {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    await this.propertyRepository.decrementFavorites(propertyId);
  }

  /**
   * Get property statistics
   */
  async getStatistics(ownerId?: string) {
    return await this.propertyRepository.getStatistics(ownerId);
  }

  /**
   * Search properties near a location
   */
  async searchNearby(
    latitude: number,
    longitude: number,
    maxDistance: number = 5000,
    filters: Partial<PropertySearchFilters> = {},
    limit: number = 20
  ): Promise<IProperty[]> {
    try {
      return await this.propertyRepository.findNearby(
        latitude,
        longitude,
        maxDistance,
        filters,
        limit
      );
    } catch (error: any) {
      console.error("PropertyService.searchNearby error:", error.message || error);
      throw error;
    }
  }

  /**
   * Get featured properties
   */
  async getFeaturedProperties(limit: number = 10): Promise<IProperty[]> {
    return await this.propertyRepository.getFeatured(limit);
  }

  /**
   * Get premium properties
   */
  async getPremiumProperties(limit: number = 10): Promise<IProperty[]> {
    return await this.propertyRepository.getPremium(limit);
  }

  /**
   * Feature a property
   */
  async featureProperty(
    propertyId: string,
    userId: string,
    durationDays: number = 30
  ): Promise<IProperty> {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    const ownerId = (property.ownerId as any)._id?.toString() || property.ownerId.toString();
    if (ownerId !== userId) {
      throw ApiError.forbidden('You do not have permission to feature this property');
    }

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + durationDays);

    const updated = await this.propertyRepository.update(propertyId, {
      isFeatured: true,
      featuredUntil
    });

    if (!updated) {
      throw ApiError.internal('Failed to feature property');
    }

    return updated;
  }

  /**
   * Make property premium
   */
  async makePremium(
    propertyId: string,
    userId: string,
    durationDays: number = 30
  ): Promise<IProperty> {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    const ownerId = (property.ownerId as any)._id?.toString() || property.ownerId.toString();
    if (ownerId !== userId) {
      throw ApiError.forbidden('You do not have permission to make this property premium');
    }

    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + durationDays);

    const updated = await this.propertyRepository.update(propertyId, {
      isPremium: true,
      premiumUntil
    });

    if (!updated) {
      throw ApiError.internal('Failed to make property premium');
    }

    return updated;
  }

  /**
   * Verify property (admin only)
   */
  async verifyProperty(
    propertyId: string,
    verifiedBy: string
  ): Promise<IProperty> {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    const updated = await this.propertyRepository.update(propertyId, {
      isVerified: true,
      verifiedBy: new Types.ObjectId(verifiedBy),
      verifiedAt: new Date()
    });

    if (!updated) {
      throw ApiError.internal('Failed to verify property');
    }

    return updated;
  }

  /**
   * Update property status
   */
  private async updatePropertyStatus(
    propertyId: string,
    userId: string,
    status: PropertyStatus
  ): Promise<IProperty> {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    const ownerId = (property.ownerId as any)._id?.toString() || property.ownerId.toString();
    if (ownerId !== userId) {
      throw ApiError.forbidden('You do not have permission to update this property');
    }

    const updated = await this.propertyRepository.update(propertyId, { status });

    if (!updated) {
      throw ApiError.internal('Failed to update property status');
    }

    return updated;
  }

  async scheduleMeet(propertyId: string, userId: string, date: Date): Promise<IProperty> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) throw ApiError.notFound('Property not found');

    const scheduleObj = {
        date,
        timeSlot: '12:00 PM',
        isBooked: true,
        bookedBy: new Types.ObjectId(userId)
    };

    property.viewingSchedule = property.viewingSchedule || [];
    property.viewingSchedule.push(scheduleObj as any);

    const updated = await this.propertyRepository.update(propertyId, { viewingSchedule: property.viewingSchedule });
    if (!updated) throw ApiError.internal('Failed to schedule meet');
    return updated;
  }

  async assignAgent(propertyId: string, ownerId: string, agentId: string): Promise<IProperty> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) throw ApiError.notFound('Property not found');
    
    const ownerIdStr = (property.ownerId as any)._id?.toString() || property.ownerId.toString();
    if (ownerIdStr !== ownerId) throw ApiError.forbidden('Only the owner can assign an agent');

    const updated = await this.propertyRepository.update(propertyId, { agentId: new Types.ObjectId(agentId) });
    if (!updated) throw ApiError.internal('Failed to assign agent');
    return updated;
  }

  /**
   * Validate property has all required fields for publishing
   */
  private validatePropertyForPublishing(property: IProperty): void {
    const errors: string[] = [];

    if (!property.title || property.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!property.description || property.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!property.images || property.images.length === 0) {
      errors.push('At least one image is required');
    }

    if (!property.addressId) {
      errors.push('Address is required');
    }

    if (!property.pricing?.salePrice && !property.pricing?.rentPrice && !property.pricing?.leasePrice) {
      errors.push('At least one price (sale, rent, or lease) is required');
    }

    if (!property.features?.bedrooms && property.propertyType === 'residential') {
      errors.push('Number of bedrooms is required for residential properties');
    }

    if (!property.features?.bathrooms && property.propertyType === 'residential') {
      errors.push('Number of bathrooms is required for residential properties');
    }

    if (!property.features?.builtUpArea) {
      errors.push('Built-up area is required');
    }

    if (errors.length > 0) {
      throw ApiError.validationError(errors);
    }
  }

  /**
   * Bulk update property status
   */
  async bulkUpdateStatus(
    propertyIds: string[],
    userId: string,
    status: PropertyStatus
  ): Promise<number> {
    // Verify ownership for all properties
    for (const id of propertyIds) {
      const property = await this.propertyRepository.findById(id);
      if (!property) {
        throw ApiError.notFound(`Property ${id} not found`);
      }
      const ownerId = (property.ownerId as any)._id?.toString() || property.ownerId.toString();
      if (ownerId !== userId) {
        throw ApiError.forbidden(`You do not have permission to update property ${id}`);
      }
    }

    return await this.propertyRepository.bulkUpdate(propertyIds, { status });
  }
}