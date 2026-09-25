import { Router } from 'express';
import { approvalsController } from './approvals.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createWorkflowSchema,
  createApprovalRequestSchema,
  actOnRequestSchema,
} from './approvals.validator.js';

const router = Router();

router.use(authenticate);

// Workflows
router.get('/', approvalsController.getWorkflows);
router.get('/workflows', approvalsController.getWorkflows);
router.post('/workflows', validate(createWorkflowSchema), approvalsController.createWorkflow);
router.get('/workflows/type/:entityType', approvalsController.getWorkflowByEntityType);
router.get('/workflows/:id', approvalsController.getWorkflowById);
router.put('/workflows/:id', approvalsController.updateWorkflow);
router.delete('/workflows/:id', approvalsController.deleteWorkflow);

// Requests
router.get('/requests', approvalsController.getRequests);
router.post('/requests', validate(createApprovalRequestSchema), approvalsController.createRequest);
router.post('/requests/:id/action', validate(actOnRequestSchema), approvalsController.actOnRequest);
router.get('/pending', approvalsController.getPendingApprovals);
router.get('/history', approvalsController.getApprovalHistory);
router.get('/stats', approvalsController.getApprovalStats);

export default router;
