import { Router } from 'express';
import leaveController from './leave.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Leave Types
router.get('/types', leaveController.listTypes);
router.post('/types', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.createType);
router.put('/types/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.updateType);
router.delete('/types/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.deleteType);

// Leave Balances & Allocation
router.get('/balances', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.getBalances);
router.get('/balances/:employeeId', leaveController.getEmployeeBalances);
router.post('/bulk-allocate', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.bulkAllocate);
router.post('/balances/bulk-allocate', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.bulkAllocate);
router.post('/carry-forward', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.carryForward);
router.get('/balance-report', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.getBalanceReport);

// Apply & Request Management
router.post('/apply', leaveController.applyLeave);
router.get('/requests', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.listRequests);
router.post('/requests/:id/approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.approveRequest);
router.put('/requests/:id/approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.approveRequest);
router.post('/requests/:id/reject', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.rejectRequest);
router.put('/requests/:id/reject', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.rejectRequest);
router.post('/requests/bulk-approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.bulkApprove);
router.put('/requests/bulk-approve', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.bulkApprove);


// Calendar, History & Stats
router.get('/calendar', leaveController.getCalendar);
router.get('/stats', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), leaveController.getStats);
router.get('/history', leaveController.getLeaveHistory);
router.get('/history/:employeeId', leaveController.getEmployeeHistory);

export default router;
