import { injectable } from 'inversify';
import { AddressModel, IAddress, AddressType } from '../models/Address';
import { FilterQuery, UpdateQuery } from 'mongoose';

@injectable()
export class AddressRepository {
  async create(address: IAddress): Promise<IAddress> {
    const newAddress = new AddressModel(address);
    return newAddress.save();
  }

  async findByUserId(userId: string): Promise<IAddress[]> {
    return AddressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
  }
  async findById(id: string): Promise<IAddress> {
    return AddressModel.findById(id).sort({ isDefault: -1, createdAt: -1 });
  }

  async updateMany(
    filter: FilterQuery<IAddress>,
    update: UpdateQuery<IAddress>
  ): Promise<void> {
    await AddressModel.updateMany(filter, update);
  }


  async findDefaultByUserId(userId: string, type: AddressType): Promise<IAddress | null> {
    return AddressModel.findOne({ userId, type, isDefault: true });
  }

  async update(id: string, address: Partial<IAddress>): Promise<IAddress | null> {
    return AddressModel.findByIdAndUpdate(
      id,
      { $set: address },
      { new: true, runValidators: true }
    );
  }
  async findByIdAndUpdate(
    id: string,
    update: UpdateQuery<IAddress>,
    options?: { new: boolean }
  ): Promise<IAddress | null> {
    return AddressModel.findByIdAndUpdate(id, update, options);
  }

  async delete(id: string): Promise<boolean> {
    return await AddressModel.findByIdAndDelete(id);
  }
}