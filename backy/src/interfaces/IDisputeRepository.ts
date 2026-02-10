import { IDispute, DisputeStatus } from "../models/Dispute";

export interface IDisputeRepository {
  create(dispute: Partial<IDispute>): Promise<IDispute>;
  findById(id: string): Promise<IDispute | null>;
  findAll(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: DisputeStatus;
      type?: string;
      query?: string;
    }
  ): Promise<{
    data: IDispute[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getStatistics (userId?: string);
  updateStatus(id: string, status: DisputeStatus): Promise<IDispute | null>;
  addResponse(disputeId: string, response: any): Promise<IDispute | null>;
  deleteById(id: string): Promise<IDispute | null>;
}
