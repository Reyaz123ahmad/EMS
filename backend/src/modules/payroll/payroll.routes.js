import { Router } from 'express';
import payrollController from './payroll.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Salary Components
router.get('/components', cacheResponse('cache:payroll_components', 60), payrollController.listComponents);
router.post('/components', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.createComponent);
router.put('/components/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.updateComponent);
router.delete('/components/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.deleteComponent);

// Salary Structures & Directives
router.get('/salary-structures/templates', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:payroll_templates', 60), payrollController.listStructureTemplates);
router.get('/templates', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:payroll_templates', 60), payrollController.listStructureTemplates);
router.post('/salary-structures', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.createStructureTemplate);
router.post('/structures', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.createStructureTemplate);
router.get('/salary-structures', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:payroll_structures', 60), payrollController.listSalaryStructures);
router.get('/structures', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:payroll_structures', 60), payrollController.listSalaryStructures);
router.get('/structure/:employeeId', cacheResponse('cache:payroll_emp_struct', 60), payrollController.getStructure);
router.get('/employee/:employeeId/structure', cacheResponse('cache:payroll_emp_struct', 60), payrollController.getStructure);
router.put('/structure/:employeeId', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.updateStructure);
router.put('/employee/:employeeId/structure', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.updateStructure);
router.post('/structure/bulk-update', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.bulkUpdateStructure);

// Reimbursements, Loans & Tax Slabs
router.get('/reimbursements', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:payroll_reimbursements', 60), payrollController.listReimbursements);
router.get('/loans-advances', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:payroll_loans', 60), payrollController.listLoansAdvances);
router.get('/loans', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:payroll_loans', 60), payrollController.listLoansAdvances);
router.get('/tax-slabs', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:payroll_tax_slabs', 60), payrollController.listTaxSlabs);
router.get('/analytics', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:payroll_analytics', 60), payrollController.getPayrollAnalytics);

// Payroll Operations
router.post('/preview', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.preview);
router.post('/process', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.process);
router.post('/runs/:id/approve', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.approve);
router.put('/runs/:id/approve', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.approve);
router.post('/runs/:id/generate-slips', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.generatePDFs);
router.post('/runs/:id/send-slips', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), payrollController.sendSlips);

// Query Runs & Slips
router.get('/runs', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:payroll_runs', 60), payrollController.listRuns);
router.get('/slips/my', cacheResponse('cache:payroll_my_slips', 60), payrollController.getMySlips);
router.get('/slips', cacheResponse('cache:payroll_slips', 60), payrollController.listSlips);
router.get('/slips/:id/download', payrollController.downloadSlip);
router.get('/slips/:id/pdf', payrollController.downloadSlip);
router.get('/stats', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:payroll_stats', 60), payrollController.getStats);

export default router;
