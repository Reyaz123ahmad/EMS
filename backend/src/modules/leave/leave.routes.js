import { Router } from 'express';
import leaveController from './leave.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Leave Types
router.get('/types', cacheResponse('cache:leave_types', 180), leaveController.listTypes);
router.post('/types', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.createType);
router.put('/types/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.updateType);
router.delete('/types/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.deleteType);

// Leave Balances & Allocation
router.get('/balances', cacheResponse('cache:leave_balances', 60), leaveController.getBalances);
router.get('/balances/:employeeId', cacheResponse('cache:leave_emp_balances', 60), leaveController.getEmployeeBalances);
router.post('/bulk-allocate', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.bulkAllocate);
router.post('/balances/bulk-allocate', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.bulkAllocate);
router.post('/carry-forward', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.carryForward);
router.get('/balance-report', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), cacheResponse('cache:leave_bal_report', 60), leaveController.getBalanceReport);

// Apply & Request Management
router.post('/apply', leaveController.applyLeave);
router.post('/requests', leaveController.applyLeave);
router.get('/requests/my', cacheResponse('cache:leave_my_reqs', 60), leaveController.getMyRequests);
router.get('/requests', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), cacheResponse('cache:leave_requests', 60), leaveController.listRequests);
router.post('/requests/:id/approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), leaveController.approveRequest);
router.put('/requests/:id/approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), leaveController.approveRequest);
router.post('/requests/:id/reject', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), leaveController.rejectRequest);
router.put('/requests/:id/reject', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), leaveController.rejectRequest);
router.post('/requests/bulk-approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), leaveController.bulkApprove);
router.put('/requests/bulk-approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), leaveController.bulkApprove);

// Calendar, History & Stats
router.get('/calendar', cacheResponse('cache:leave_calendar', 60), leaveController.getCalendar);
router.get('/stats', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'), cacheResponse('cache:leave_stats', 60), leaveController.getStats);
router.get('/history', cacheResponse('cache:leave_history', 60), leaveController.getLeaveHistory);
router.get('/history/:employeeId', cacheResponse('cache:leave_emp_history', 60), leaveController.getEmployeeHistory);

export default router;
