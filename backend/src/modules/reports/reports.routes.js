import { Router } from 'express';
import reportsController from './reports.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);

// Break Reports (COMPANY_ADMIN & HR_ADMIN only)
router.get('/breaks', requireRole('COMPANY_ADMIN', 'HR_ADMIN'), reportsController.getBreaksReport);
router.get('/breaks/summary', requireRole('COMPANY_ADMIN', 'HR_ADMIN'), reportsController.getBreaksSummary);
router.get('/breaks/employee/:employeeId', requireRole('COMPANY_ADMIN', 'HR_ADMIN'), reportsController.getEmployeeBreaksReport);

router.post('/generate', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), reportsController.generateReport);
router.post('/export', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), reportsController.exportReport);
router.get('/stats', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:reports_stats', 60), reportsController.getReportStats);
router.get('/history', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:reports_history', 60), reportsController.getReportHistory);
router.get('/download', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), reportsController.downloadReport);
router.get('/:id/download', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), reportsController.downloadReport);

export default router;
