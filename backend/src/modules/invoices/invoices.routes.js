import { Router } from 'express';
import * as controller from './invoices.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate);

// List invoices
router.get('/', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'), controller.listInvoices);

// Download invoice PDF
router.get('/:id/download', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'), controller.downloadInvoice);

// Send invoice email
router.post('/:id/send-email', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'), controller.sendInvoiceEmail);

export default router;
