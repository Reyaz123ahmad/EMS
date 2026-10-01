import { Router } from 'express';
import { approvalsController } from './approvals.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createWorkflowSchema,
  createApprovalRequestSchema,
  actOnRequestSchema,
} from './approvals.validator.js';

import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);

// Workflows
router.get('/', cacheResponse('cache:approvals_workflows', 60), approvalsController.getWorkflows);
router.get('/workflows', cacheResponse('cache:approvals_workflows', 60), approvalsController.getWorkflows);
router.post('/workflows', validate(createWorkflowSchema), approvalsController.createWorkflow);
router.get('/workflows/type/:entityType', cacheResponse('cache:approvals_wf_type', 60), approvalsController.getWorkflowByEntityType);
router.get('/workflows/:id', cacheResponse('cache:approvals_wf_detail', 60), approvalsController.getWorkflowById);
router.put('/workflows/:id', approvalsController.updateWorkflow);
router.delete('/workflows/:id', approvalsController.deleteWorkflow);

// Requests
router.get('/requests', cacheResponse('cache:approvals_requests', 60), approvalsController.getRequests);
router.post('/requests', validate(createApprovalRequestSchema), approvalsController.createRequest);
router.post('/requests/:id/action', validate(actOnRequestSchema), approvalsController.actOnRequest);
router.post('/requests/:id/approve', approvalsController.approveRequest);
router.post('/requests/:id/reject', approvalsController.rejectRequest);
router.get('/pending', cacheResponse('cache:approvals_pending', 60), approvalsController.getPendingApprovals);
router.get('/history', cacheResponse('cache:approvals_history', 60), approvalsController.getApprovalHistory);
router.get('/stats', cacheResponse('cache:approvals_stats', 60), approvalsController.getApprovalStats);

export default router;
