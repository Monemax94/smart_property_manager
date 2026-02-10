import { inject, injectable } from 'inversify';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { IProfile } from '../models/Profile';
import { TYPES } from '../config/types';

@injectable()
export class ProfileService {
  constructor(
    @inject(TYPES.ProfileRepository) private profileRepo: ProfileRepository
  ) {}

  create(data: Partial<IProfile>, userId: string) {
    return this.profileRepo.create(data, userId);
  }

  findById(id: string) {
    return this.profileRepo.findById(id);
  }
  findUserById(userId: string) {
    return this.profileRepo.findUserById(userId);
  }

  update(id: string, data: Partial<IProfile>) {
    return this.profileRepo.update(id, data);
  }
  updateProfileByUserId(id: string, data: Partial<IProfile>) {
    return this.profileRepo.updateProfileByUserId(id, data);
  }

  delete(id: string) {
    return this.profileRepo.delete(id);
  }

  findAll() {
    return this.profileRepo.findAll();
  }
}
