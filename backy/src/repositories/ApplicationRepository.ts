import { injectable } from 'inversify';
import { ApplicationModel, IApplication } from '../models/Application';

@injectable()
export class ApplicationRepository {
  async create(data: Partial<IApplication>): Promise<IApplication> {
    return await ApplicationModel.create(data);
  }
  
  async findById(id: string): Promise<IApplication | null> {
    return await ApplicationModel.findById(id).populate('propertyId tenantId agentId');
  }

  async findByTenant(tenantId: string): Promise<IApplication[]> {
    return await ApplicationModel.find({ tenantId }).populate('propertyId');
  }

  async findByAgent(agentId: string): Promise<IApplication[]> {
    return await ApplicationModel.find({ agentId }).populate('propertyId tenantId');
  }

  async update(id: string, data: Partial<IApplication>): Promise<IApplication | null> {
    return await ApplicationModel.findByIdAndUpdate(id, data, { new: true });
  }
}
