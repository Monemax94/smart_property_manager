import { injectable } from "inversify";
import { Types } from "mongoose";
import { IDisputeRepository } from "../interfaces/IDisputeRepository";
import { DisputeModel, IDispute, DisputeStatus } from "../models/Dispute";
import { OrderModel, OrderStatus } from "../models/OrderModel";

const userPopulate = {
  path: 'raisedBy',
  select: 'email phoneNumber profile',
  populate: {
    path: 'profile',
    model: 'Profile',
    select: 'firstName lastName avatar address'
  }
};

const responsePopulate = {
  path: 'responses.responder',
  select: 'email phoneNumber profile',
  populate: {
    path: 'profile',
    model: 'Profile',
    select: 'firstName lastName photo address timeZone jobTitle bio'
  }
};

const orderPopulate = {
  path: 'order',
  populate: [
    {
      path: 'products',
      model: 'Product',
      select: 'name price images description vendorId',
      populate: {
        path: 'vendorId',
        model: 'Vendor',
        select: 'storeName logo verified performance',
        populate: {
          path: 'user',
          model: 'User',
          select: 'email phoneNumber'
        }
      }
    },
    {
      path: 'userId',
      model: 'User',
      select: 'email phoneNumber'
    }
  ]
};

@injectable()
export class DisputeRepository implements IDisputeRepository {

  create = async (dispute: Partial<IDispute>): Promise<IDispute> => {
    const disputeResult = await DisputeModel.create(dispute);
  
    // If dispute is linked to an order → update order tracking
    if (dispute?.order) {
      const order = await OrderModel.findById(dispute.order);
      if (order) {
        
        //  Update order status
        // order.status = OrderStatus.DISPUTE;
  
        // Add dispute tracking event
        await order.addOrUpdateTrackingEvent({
          status: OrderStatus.DISPUTE,
          description: dispute?.description || "A dispute has been submitted by the user.",
          location: "customer",
          media: dispute?.attachments || [],
          timestamp: new Date()
        });
  
        // Save order
        await order.save();
      }
    }
  
    return disputeResult;
  };
  

  findById = async (id: string): Promise<IDispute | null> => {
    return await DisputeModel.findById(id)
      .populate(orderPopulate)
      .populate(userPopulate)
      .populate(responsePopulate);
  }

  async getStatistics(userId?: string) {
    const matchStage: any = { isDeleted: false };
    if (userId) matchStage.raisedBy = new Types.ObjectId(userId);

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 }
        }
      }
    ];

    const stats = await DisputeModel.aggregate(pipeline);
    const result: Record<string, number> = {
      PENDING: 0,
      RESOLVED: 0,
      REJECTED: 0
    };
    for (const stat of stats) {
      result[stat._id] = stat.count;
    }
    return result;
  }

  findAll = async (
    userId?: string,
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
  }> => {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      query
    } = options || {};
  
    const skip = (page - 1) * limit;
    const filter: any = {
      isDeleted: false
    };
    if (userId) filter.raisedBy = userId; 
  
    if (status) {
      filter.currentStatus = status;
    }
  
    if (type) {
      filter.disputeType = { $regex: new RegExp(type, 'i') };
    }
    if (query) {
      filter.description = { $regex: new RegExp(query, 'i') };
    }

    const [data, total] = await Promise.all([
      DisputeModel.find(filter)
        .populate(orderPopulate)
        .populate(userPopulate)
        .populate(responsePopulate) 
        .sort({ raisedOn: -1 })
        .skip(skip)
        .limit(limit),
      DisputeModel.countDocuments(filter)
    ]);
  
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  updateStatus = async (id: string, status: DisputeStatus): Promise<IDispute | null> => {
    return await DisputeModel.findByIdAndUpdate(
      id,
      { currentStatus: status, lastUpdated: new Date() },
      { new: true }
    );
  }

  addResponse = async (disputeId: string, response: any): Promise<IDispute | null> => {
    return await DisputeModel.findByIdAndUpdate(
      disputeId,
      {
        $push: { responses: response },
        $set: { lastUpdated: new Date() },
      },
      { new: true }
    );
  }

  deleteById = async (id: string): Promise<IDispute | null> => {
    return await DisputeModel.findByIdAndUpdate(id, { isDeleted: true });
  }
}