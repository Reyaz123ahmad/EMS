import { Router } from 'express';
import * as controller from './payments.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

// Webhook endpoint (public with signature verification)
router.post('/webhook', controller.handleWebhook);

// Payment failure report
router.post('/failure', authenticate, controller.handleFailure);

// Retry payment
router.post('/retry', authenticate, requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'), controller.retryPayment);

// Payment history
router.get('/history', authenticate, requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'), controller.getHistory);

export default router;
