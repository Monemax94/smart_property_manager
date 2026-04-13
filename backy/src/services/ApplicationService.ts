import { injectable, inject } from 'inversify';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import { TYPES } from '../config/types';
import { ApiError } from '../utils/ApiError';
import { ApplicationStatus } from '../models/Application';
import { PropertyModel, PropertyStatus } from '../models/Property';
import { PaystackService } from './PaystackServices';

export interface ApplyDTO {
  propertyId: string;
  personalInfo: any;
  employmentInfo: any;
  references: any[];
}

@injectable()
export class ApplicationService {
  constructor(
    @inject(TYPES.ApplicationRepository) private repository: ApplicationRepository,
    @inject(TYPES.PaystackService) private paystackService: PaystackService
  ) {}

  async apply(tenantId: string, payload: ApplyDTO) {
    const property = await PropertyModel.findById(payload.propertyId);
    if (!property) throw ApiError.notFound('Property not found');
    
    const agentId = property.agentId || property.ownerId;
    
    return await this.repository.create({
      ...payload,
      propertyId: payload.propertyId as any,
      tenantId: tenantId as any,
      agentId: agentId as any,
      status: ApplicationStatus.PENDING
    });
  }

  async getMyApplications(tenantId: string) {
    return await this.repository.findByTenant(tenantId);
  }

  async getAgentApplications(agentId: string) {
    return await this.repository.findByAgent(agentId);
  }

  async proposeMeeting(userId: string, applicationId: string, meetingDate: Date, role: 'tenant' | 'agent') {
    const app = await this.repository.findById(applicationId);
    if (!app) throw ApiError.notFound('Application not found');
    
    // Check if user is either the tenant or the agent
    const isTenant = app.tenantId._id.toString() === userId;
    const isAgent = app.agentId._id.toString() === userId;
    
    if (role === 'tenant' && !isTenant) throw ApiError.unauthorized('Only tenant can propose as tenant');
    if (role === 'agent' && !isAgent) throw ApiError.unauthorized('Only agent can propose as agent');
    
    return await this.repository.update(applicationId, { 
      meetingDate, 
      meetingStatus: 'pending',
      proposedBy: role
    });
  }

  async confirmMeeting(userId: string, applicationId: string) {
    const app = await this.repository.findById(applicationId);
    if (!app) throw ApiError.notFound('Application not found');
    
    // If proposed by agent, tenant confirms. If proposed by tenant, agent confirms.
    const isTenant = app.tenantId._id.toString() === userId;
    const isAgent = app.agentId._id.toString() === userId;
    
    if (app.proposedBy === 'agent' && !isTenant) throw ApiError.unauthorized('Only tenant can confirm agent proposal');
    if (app.proposedBy === 'tenant' && !isAgent) throw ApiError.unauthorized('Only agent can confirm tenant proposal');
    
    return await this.repository.update(applicationId, { meetingStatus: 'confirmed' });
  }

  async approveApplicationAndRequestPayment(agentId: string, applicationId: string) {
    const app = await this.repository.findById(applicationId);
    if (!app) throw ApiError.notFound('Application not found');
    if (app.agentId._id.toString() !== agentId) throw ApiError.unauthorized('Not authorized');
    
    return await this.repository.update(applicationId, {
        status: ApplicationStatus.PAYMENT_PENDING
    });
  }

  async initiatePayment(tenantId: string, applicationId: string, email: string) {
    const app = await this.repository.findById(applicationId);
    if (!app) throw ApiError.notFound('Application not found');
    if (app.tenantId._id.toString() !== tenantId) throw ApiError.unauthorized('Not yours');
    if (app.status !== ApplicationStatus.PAYMENT_PENDING) throw ApiError.badRequest('Application is not pending payment');
    
    const property = app.propertyId as any;
    const rentPrice = property?.pricing?.rentPrice || 1000;

    const paymentResponse = await this.paystackService.initializePayment(
        rentPrice,
        email,
        { 
            userId: tenantId, 
            propertyId: property._id?.toString() || property.toString(), 
            applicationId: app._id.toString() 
        },
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/applications?payment=success`
    );

    return paymentResponse;
  }

  async sendAgreement(agentId: string, applicationId: string, agreementDocumentUrl: string) {
    const app = await this.repository.findById(applicationId);
    if (!app) throw ApiError.notFound('Application not found');
    if (app.agentId._id.toString() !== agentId) throw ApiError.unauthorized('Not authorized');

    return await this.repository.update(applicationId, {
        agreementDocumentUrl,
        status: ApplicationStatus.AGREEMENT_SENT
    });
  }

  async signAgreementAndOccupy(tenantId: string, applicationId: string, digitalSignature: string) {
    const app = await this.repository.findById(applicationId);
    if (!app) throw ApiError.notFound('Application not found');
    if (app.tenantId._id.toString() !== tenantId) throw ApiError.unauthorized('Not yours');
    
    const updated = await this.repository.update(applicationId, {
        digitalSignature,
        signedAt: new Date(),
        status: ApplicationStatus.COMPLETED
    });

    await PropertyModel.findByIdAndUpdate(app.propertyId, { 
      status: PropertyStatus.RENTED, 
      occupancyStatus: 'occupied' 
    });

    return updated;
  }
}
