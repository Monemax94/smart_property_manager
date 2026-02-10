import { inject, injectable } from "inversify";
import { IDisputeRepository } from "../interfaces/IDisputeRepository";
import {TYPES} from "../config/types";
import { IDispute, DisputeStatus } from "../models/Dispute";

@injectable()
export class DisputeService  {
  constructor(
    @inject(TYPES.DisputeRepository) private disputeRepo: IDisputeRepository
  ) {}

  createDispute(data: Partial<IDispute>): Promise<IDispute> {
    return this.disputeRepo.create(data);
  }

  getDispute(id: string): Promise<IDispute | null> {
    return this.disputeRepo.findById(id);
  }
  getStatistics(userId?: string){
    return this.disputeRepo.getStatistics(userId);
  }


  listDisputes = async (userId?: string, options?: {
    page?: number;
    limit?: number;
    status?: DisputeStatus;
    type?: string;
    query?: string;
  }) =>{
    return await this.disputeRepo.findAll(userId, options);
  }

  updateDisputeStatus(id: string, status: DisputeStatus): Promise<IDispute | null> {
    return this.disputeRepo.updateStatus(id, status);
  }

  respondToDispute(disputeId: string, response: any): Promise<IDispute | null> {
    return this.disputeRepo.addResponse(disputeId, response);
  }

  deleteDispute(id: string):  Promise<IDispute | null> {
    return this.disputeRepo.deleteById(id);
  }
}
