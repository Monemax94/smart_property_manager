import { injectable } from 'inversify';
import { PlanModel, IPlan } from '../models/Plan';

@injectable()
export class PlanService {
  getAllPlans = async (): Promise<IPlan[]> =>{
    return PlanModel.find();
  }

  getPlanById = async (id: string): Promise<IPlan | null> =>{
    return PlanModel.findById(id);
  }

  async createPlan(data: Partial<IPlan>): Promise<IPlan> {
    return PlanModel.create(data);
  }

  updatePlan = async (id: string, data: Partial<IPlan>): Promise<IPlan | null> => {
    return PlanModel.findByIdAndUpdate(id, data, { new: true });
  }

  deletePlan = async (id: string): Promise<IPlan | null> =>{
    return PlanModel.findByIdAndDelete(id);
  }
}
