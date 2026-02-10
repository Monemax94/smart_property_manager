import { injectable } from 'inversify';
import { CarouselModel, ICarousel } from '../models/Carousel';

@injectable()
export class CarouselRepository {
  async create(data: Partial<ICarousel>) {
    return await CarouselModel.create(data);
  }

  async findAll() {
    return await CarouselModel.find().sort({ position: 1 });
  }

  async findActive() {
    return await CarouselModel.find({ isActive: true }).sort({ position: 1 });
  }

  async findById(id: string) {
    return await CarouselModel.findById(id);
  }

  async update(id: string, data: Partial<ICarousel>) {
    return await CarouselModel.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return await CarouselModel.findByIdAndDelete(id);
  }
}