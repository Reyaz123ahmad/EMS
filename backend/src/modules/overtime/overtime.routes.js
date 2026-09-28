import { Router } from 'express';
import overtimeController from './overtime.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Overtime Rules
router.get('/rules', overtimeController.listRules);
router.post('/rules', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), overtimeController.createRule);
router.put('/rules/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), overtimeController.updateRule);
router.delete('/rules/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), overtimeController.deleteRule);

// Calculate & Records
router.post('/calculate', overtimeController.calculate);
router.get('/my', overtimeController.listRecords);
router.get('/my-records', overtimeController.listRecords);
router.get('/records', overtimeController.listRecords);
router.get('/report', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.getReport);
router.get('/stats', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'SUPER_ADMIN'), overtimeController.getStats);

// Overtime Requests & Approvals
router.post('/apply', overtimeController.apply);
router.post('/requests', overtimeController.apply);
router.get('/requests', overtimeController.listRequests);
router.post('/requests/:id/approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.approveRequest);
router.put('/requests/:id/approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.approveRequest);
router.post('/requests/:id/reject', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.rejectRequest);
router.put('/requests/:id/reject', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.rejectRequest);
router.post('/requests/bulk-approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.bulkApprove);
router.put('/requests/bulk-approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.bulkApprove);

export default router;
