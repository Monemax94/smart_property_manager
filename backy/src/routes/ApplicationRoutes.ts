import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { ApplicationController } from '../controllers/ApplicationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const applicationController = container.get<ApplicationController>(TYPES.ApplicationController);

// Tenant routes
router.post('/apply', authenticate, applicationController.applyForProperty);
router.get('/my-applications', authenticate, applicationController.getMyApplications);
router.post('/:id/propose-meeting', authenticate, applicationController.proposeMeeting);
router.post('/:id/confirm-meeting', authenticate, applicationController.confirmMeeting);
router.post('/:id/pay', authenticate, applicationController.initiatePayment);
router.post('/:id/sign', authenticate, applicationController.signAgreement);

// Agent routes
router.get('/agent-applications', authenticate, applicationController.getAgentApplications);
router.post('/:id/approve', authenticate, applicationController.approveApplication);
router.post('/:id/send-agreement', authenticate, applicationController.sendAgreement);

export default router;
