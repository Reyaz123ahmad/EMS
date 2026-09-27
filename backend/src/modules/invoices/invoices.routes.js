import { Router } from 'express';
import * as controller from './invoices.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate);

// List invoices (Platform-level view for Super Admin, company-level for Company Admin)
router.get('/', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN'), controller.listInvoices);

// Download invoice PDF
router.get('/:id/download', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'EMPLOYEE'), controller.downloadInvoice);
router.get('/:id/pdf', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'EMPLOYEE'), controller.downloadInvoice);

// Send invoice email
router.post('/:id/send-email', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN'), controller.sendInvoiceEmail);

// Get single invoice by ID
router.get('/:id', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'EMPLOYEE'), controller.getInvoiceById);

export default router;
