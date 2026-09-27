import { Router } from 'express';
import * as controller from './payments.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

// Razorpay config & order endpoints
router.get('/razorpay-config', authenticate, controller.getRazorpayConfig);
router.post('/create-order', authenticate, controller.createOrder);
router.post('/orders', authenticate, controller.createOrder);
router.post('/verify', authenticate, controller.verifyPayment);

// Webhook endpoint (public with signature verification)
router.post('/webhook', controller.handleWebhook);

// Payment failure report
router.post('/failure', authenticate, controller.handleFailure);

// Retry payment
router.post('/retry', authenticate, requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'), controller.retryPayment);

// Payment history
router.get('/history', authenticate, requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'), controller.getHistory);

// Download receipt PDF
router.get('/:id/receipt', authenticate, requireRole('COMPANY_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'EMPLOYEE'), controller.downloadReceipt);

export default router;
