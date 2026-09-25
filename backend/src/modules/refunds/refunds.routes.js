import { Router } from 'express';
import * as controller from './refunds.controller.js';
import * as validator from './refunds.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

// Customer Request
router.post(
  '/request',
  authenticate,
  requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'),
  validate(validator.createRefundRequestSchema),
  controller.requestRefund
);

// Company view refunds
router.get(
  '/',
  authenticate,
  requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'),
  controller.listRefunds
);

// Super Admin view all refunds
router.get(
  '/all',
  authenticate,
  requireRole('SUPER_ADMIN'),
  controller.listAllRefunds
);

// Stats
router.get(
  '/stats',
  authenticate,
  requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'),
  controller.getStats
);

// System Issue Refund (Super Admin)
router.post(
  '/system-issue',
  authenticate,
  requireRole('SUPER_ADMIN'),
  validate(validator.systemIssueRefundSchema),
  controller.systemIssueRefund
);

// Specific refund details
router.get(
  '/:id',
  authenticate,
  requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'),
  controller.getRefund
);

// Approve refund
router.post(
  '/:id/approve',
  authenticate,
  requireRole('SUPER_ADMIN'),
  validate(validator.approveRefundSchema),
  controller.approveRefund
);

// Reject refund
router.post(
  '/:id/reject',
  authenticate,
  requireRole('SUPER_ADMIN'),
  validate(validator.rejectRefundSchema),
  controller.rejectRefund
);

// Process refund
router.post(
  '/:id/process',
  authenticate,
  requireRole('SUPER_ADMIN'),
  validate(validator.processRefundSchema),
  controller.processRefund
);

// Retry refund
router.post(
  '/:id/retry',
  authenticate,
  requireRole('SUPER_ADMIN'),
  controller.retryRefund
);

export default router;
