import { Document } from 'mongoose';
import CarieerModel, { ICarrieer, ICarrieerData } from '../models/Carieer';
import { FileInfo } from '../models/File';
import { inject, injectable } from 'inversify';

import { UpdateQuery } from 'mongoose';
export interface CarrierFilters {
  search?: string;
  includeDeleted?: boolean;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface SortOptions {
  field: 'name' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface PaginatedCarrierResult {
  data: ICarrieer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@injectable()
export class CarrieerRepository {
    
  async create(carieerData: Omit<ICarrieerData, 'createdAt' | 'updatedAt' | 'isDeleted'>): Promise<ICarrieer & Document> {
    return CarieerModel.create(carieerData);
  }

  async findAll(
    filters: CarrierFilters = {},
    pagination: PaginationOptions = { page: 1, pageSize: 10 },
    sort: SortOptions = { field: 'name', direction: 'asc' }
  ): Promise<PaginatedCarrierResult> {
    // Build the query
    const query: Record<string, any> = {};
    
    // Include deleted filter
    if (!filters.includeDeleted) {
      query.isDeleted = false;
    }
    
    // Search filter
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }
    
    // Pagination calculations
    const skip = (pagination.page - 1) * pagination.pageSize;
    
    // Sorting
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sort.field] = sort.direction === 'asc' ? 1 : -1;
    
    // Execute queries in parallel
    const [carriers, total] = await Promise.all([
      CarieerModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pagination.pageSize)
        .exec(),
      
      CarieerModel.countDocuments(query)
    ]);
    
    return {
      data: carriers,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize)
    };
  }

  async findById(id: string): Promise<(ICarrieer & Document) | null> {
    return CarieerModel.findById(id).exec();
  }

  async update(
    id: string,
    updateData: UpdateQuery<ICarrieerData> & { images?: FileInfo[] }
  ): Promise<ICarrieer | null> {
    // Prepare update object
    const update: UpdateQuery<ICarrieer> = {};
    
    // Handle regular fields
    if (updateData.name) update.name = updateData.name;
    if (updateData.description) update.description = updateData.description;
    
    // Handle image appending
    if (updateData.images && updateData.images.length > 0) {
      update.$push = { images: { $each: updateData.images } };
    }
    return CarieerModel.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    ).exec();
  }

  async delete(id: string): Promise<(ICarrieer & Document) | null> {
    return CarieerModel.findByIdAndUpdate(
        id,
        {isDeleted: true},
        { new: true, runValidators: true }
      ).exec();;
  }

  async addImage(id: string, imageData: FileInfo): Promise<(ICarrieer & Document) | null> {
    return CarieerModel.findByIdAndUpdate(
      id,
      { $push: { images: imageData } },
      { new: true }
    ).exec();
  }

  async removeImage(id: string, imageId: string): Promise<(ICarrieer & Document) | null> {
    return CarieerModel.findByIdAndUpdate(
      id,
      { $pull: { images: { publicId: `qartt/${imageId}` } } },
      { new: true }
    ).exec();
  }
}