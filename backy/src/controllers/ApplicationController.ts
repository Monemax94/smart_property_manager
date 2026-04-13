import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { ApplicationService } from '../services/ApplicationService';
import { TYPES } from '../config/types';
import { AuthenticatedRequest } from '../types/customRequest';

@injectable()
export class ApplicationController {
  constructor(
    @inject(TYPES.ApplicationService) private applicationService: ApplicationService
  ) {}

  applyForProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      
      const payload = req.body;
      const application = await this.applicationService.apply(req.user.id, payload);
      
      res.status(201).json({ success: true, data: application, message: 'Application submitted successfully' });
    } catch (error) {
      next(error);
    }
  };

  getMyApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const applications = await this.applicationService.getMyApplications(req.user.id);
      res.status(200).json({ success: true, data: applications });
    } catch (error) {
      next(error);
    }
  };

  getAgentApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const applications = await this.applicationService.getAgentApplications(req.user.id);
      res.status(200).json({ success: true, data: applications });
    } catch (error) {
      next(error);
    }
  };

  proposeMeeting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const { meetingDate, role } = req.body;
        
        const application = await this.applicationService.proposeMeeting(req.user.id, id, new Date(meetingDate), role);
        res.status(200).json({ success: true, data: application, message: 'Meeting proposed successfully' });
    } catch (error) {
        next(error);
    }
  };

  confirmMeeting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        
        const application = await this.applicationService.confirmMeeting(req.user.id, id);
        res.status(200).json({ success: true, data: application, message: 'Meeting confirmed successfully' });
    } catch (error) {
        next(error);
    }
  };

  approveApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const application = await this.applicationService.approveApplicationAndRequestPayment(req.user.id, id);
        
        res.status(200).json({ success: true, data: application, message: 'Application approved, payment requested' });
    } catch (error) {
        next(error);
    }
  };

  initiatePayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const paymentResponse = await this.applicationService.initiatePayment(req.user.id, id, req.user.email);
        res.status(200).json({ success: true, data: paymentResponse, message: 'Payment initiated' });
    } catch (error) {
        next(error);
    }
  };

  sendAgreement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
          if (!req.user) {
              res.status(401).json({ success: false, message: 'Authentication required' });
              return;
          }
          const { id } = req.params;
          const { agreementDocumentUrl } = req.body;

          const application = await this.applicationService.sendAgreement(req.user.id, id, agreementDocumentUrl);
          res.status(200).json({ success: true, data: application, message: 'Agreement sent successfully' });
      } catch (error) {
          next(error);
      }
  };

  signAgreement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
          if (!req.user) {
              res.status(401).json({ success: false, message: 'Authentication required' });
              return;
          }
          const { id } = req.params;
          const { digitalSignature } = req.body;

          const application = await this.applicationService.signAgreementAndOccupy(req.user.id, id, digitalSignature);
          res.status(200).json({ success: true, data: application, message: 'Agreement signed, occupancy granted' });
      } catch (error) {
          next(error);
      }
  };
}
