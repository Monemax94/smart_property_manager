import { Model, Document } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(item: Partial<T>, userId?:string): Promise<T> {
    const doc = new this.model(item);
    return await doc.save();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }
}
