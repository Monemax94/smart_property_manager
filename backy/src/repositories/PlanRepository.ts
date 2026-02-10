import { injectable } from 'inversify';
import { PlanModel, IPlan } from '../models/Plan';

@injectable()
export class PlanRepository {
  async findById(planId: string): Promise<IPlan | null> {
    return PlanModel.findById(planId);
  }

}

