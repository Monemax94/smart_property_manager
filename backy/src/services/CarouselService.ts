import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { CarouselRepository } from '../repositories/CarouselRepository';
import { ICarousel } from '../models/Carousel';
;

@injectable()
export class CarouselService   {
  constructor(
    @inject(TYPES.CarouselRepository) private repo: CarouselRepository
  ) {}
  async createBanner(data: any) {
    if (!data.title || !data.image) {
      throw new Error("Title and image are required");
    }

    return await this.repo.create(data);
  }

  async getAllBanners() {
    return await this.repo.findAll();
  }

  async getActiveBanners() {
    return await this.repo.findActive();
  }

  async updateBanner(id: string, data: Partial<ICarousel>) {
    return await this.repo.update(id, data);
  }

  async deleteBanner(id: string) {
    return await this.repo.delete(id);
  }
}