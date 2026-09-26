import { Router } from 'express';
import payrollController from './payroll.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Salary Components
router.get('/components', payrollController.listComponents);
router.post('/components', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.createComponent);
router.put('/components/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.updateComponent);
router.delete('/components/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.deleteComponent);

// Salary Structures
router.get('/structure/:employeeId', payrollController.getStructure);
router.put('/structure/:employeeId', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.updateStructure);
router.post('/structure/bulk-update', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.bulkUpdateStructure);

// Payroll Operations
router.post('/preview', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.preview);
router.post('/process', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.process);
router.post('/runs/:id/approve', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.approve);
router.put('/runs/:id/approve', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.approve);
router.post('/runs/:id/generate-slips', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.generatePDFs);
router.post('/runs/:id/send-slips', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.sendSlips);


// Query Runs & Slips
router.get('/runs', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.listRuns);
router.get('/slips', payrollController.listSlips);
router.get('/slips/:id/download', payrollController.downloadSlip);
router.get('/slips/:id/pdf', payrollController.downloadSlip);
router.get('/stats', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.getStats);

export default router;
