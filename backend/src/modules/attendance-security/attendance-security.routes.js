import { Router } from 'express';
import attendanceSecurityController from './attendance-security.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';

const router = Router();

// Apply auth and subscription protection
router.use(authenticate);
router.use(requireActiveSubscription);

// Liveness challenge & verification
router.post(
  '/liveness/challenge',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'),
  attendanceSecurityController.createLivenessChallenge
);

router.post(
  '/liveness/verify',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'),
  attendanceSecurityController.verifyLiveness
);

// Fraud signals incident review & statistics
router.get(
  '/fraud-signals',
  requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceSecurityController.getFraudSignals
);

router.post(
  '/fraud-signals/:id/review',
  requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceSecurityController.reviewFraudSignal
);

router.get(
  '/fraud-stats',
  requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceSecurityController.getFraudStats
);

export default router;
