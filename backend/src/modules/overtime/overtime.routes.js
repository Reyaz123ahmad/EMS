import { Router } from 'express';
import overtimeController from './overtime.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Overtime Rules
router.get('/rules', cacheResponse('cache:overtime_rules', 60), overtimeController.listRules);
router.post('/rules', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), overtimeController.createRule);
router.put('/rules/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), overtimeController.updateRule);
router.delete('/rules/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), overtimeController.deleteRule);

// Calculate & Records
router.post('/calculate', overtimeController.calculate);
router.get('/my', cacheResponse('cache:overtime_my', 60), overtimeController.listRecords);
router.get('/my-records', cacheResponse('cache:overtime_my_records', 60), overtimeController.listRecords);
router.get('/records', cacheResponse('cache:overtime_records', 60), overtimeController.listRecords);
router.get('/report', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), cacheResponse('cache:overtime_report', 60), overtimeController.getReport);
router.get('/stats', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'SUPER_ADMIN'), cacheResponse('cache:overtime_stats', 60), overtimeController.getStats);

// Overtime Requests & Approvals
router.post('/apply', overtimeController.apply);
router.post('/requests', overtimeController.apply);
router.get('/requests', cacheResponse('cache:overtime_requests', 60), overtimeController.listRequests);
router.post('/requests/:id/approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.approveRequest);
router.put('/requests/:id/approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.approveRequest);
router.post('/requests/:id/reject', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.rejectRequest);
router.put('/requests/:id/reject', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.rejectRequest);
router.post('/requests/bulk-approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.bulkApprove);
router.put('/requests/bulk-approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), overtimeController.bulkApprove);

export default router;
