import { injectable } from 'inversify';
import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import { CustomProductRequestModel, ICustomProductRequest, CustomProductStatus, VendorOffer } from '../models/ProductRequest';

@injectable()
export class OrderRequestRepository{
  async create(data: Partial<ICustomProductRequest>): Promise<ICustomProductRequest> {
    return CustomProductRequestModel.create(data);
  }

  async findById(id: string): Promise<ICustomProductRequest | null> {
    return CustomProductRequestModel.findById(id)
      .populate('customerId', 'name email')
      .populate('category', 'name')
      .populate('vendorOffers.vendorId', 'businessName email');
  }

  async findByCustomer(customerId: string): Promise<ICustomProductRequest[]> {
    return CustomProductRequestModel.find({ customerId: new Types.ObjectId(customerId) })
      .populate('category', 'name')
      .sort({ createdAt: -1 });
  }

  async findActiveRequests(categoryId?: string): Promise<ICustomProductRequest[]> {
    const filter: FilterQuery<ICustomProductRequest> = {
      status: CustomProductStatus.PENDING,
      expiresAt: { $gt: new Date() }
    };

    if (categoryId) {
      filter.category = new Types.ObjectId(categoryId);
    }

    return CustomProductRequestModel.find(filter)
      .populate('customerId', 'name')
      .populate('category', 'name')
      .sort({ createdAt: -1 });
  }

  async addVendorOffer(
    requestId: string, 
    offer: Omit<VendorOffer, 'createdAt' | 'updatedAt'>
  ): Promise<ICustomProductRequest | null> {
    return CustomProductRequestModel.findByIdAndUpdate(
      requestId,
      { 
        $push: { vendorOffers: offer },
        $set: { status: CustomProductStatus.VENDOR_OFFERS }
      },
      { new: true }
    );
  }

  async acceptVendorOffer(
    requestId: string, 
    offerId: string
  ): Promise<ICustomProductRequest | null> {
    return CustomProductRequestModel.findByIdAndUpdate(
      requestId,
      { 
        $set: { 
          selectedVendorOffer: new Types.ObjectId(offerId),
          status: CustomProductStatus.CUSTOMER_REVIEW
        }
      },
      { new: true }
    );
  }

  async placeOrder(requestId: string): Promise<ICustomProductRequest | null> {
    return CustomProductRequestModel.findByIdAndUpdate(
      requestId,
      { $set: { status: CustomProductStatus.ORDER_PLACED } },
      { new: true }
    );
  }

  async updateStatus(
    requestId: string, 
    status: CustomProductStatus
  ): Promise<ICustomProductRequest | null> {
    return CustomProductRequestModel.findByIdAndUpdate(
      requestId,
      { $set: { status } },
      { new: true }
    );
  }

  async expireOldRequests(): Promise<void> {
    await CustomProductRequestModel.updateMany(
      {
        status: CustomProductStatus.PENDING,
        expiresAt: { $lt: new Date() }
      },
      { $set: { status: CustomProductStatus.EXPIRED } }
    );
  }
}
