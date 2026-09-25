import { Router } from 'express';
import { biometricCardsController } from './biometric-cards.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription, requireFeature } from '../../middlewares/subscription.middleware.js';

const router = Router();

// Public endpoint: verify QR validity without requiring full login
router.post('/verify-qr', biometricCardsController.verifyQR);

// Protected routes (require auth + active subscription + feature flag)
router.use(authenticate, requireActiveSubscription);

router.post(
  '/generate',
  requireRole('HR_ADMIN', 'HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  requireFeature('attendance.card'),
  biometricCardsController.generateCard
);

router.post(
  '/assign',
  requireRole('HR_ADMIN', 'HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  requireFeature('attendance.card'),
  biometricCardsController.assignCard
);

router.post(
  '/:id/regenerate',
  requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  requireFeature('attendance.card'),
  biometricCardsController.regenerateQR
);

router.post(
  '/:id/deactivate',
  requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  requireFeature('attendance.card'),
  biometricCardsController.deactivateCard
);

router.get(
  '/employee/:employeeId',
  requireRole('EMPLOYEE', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  requireFeature('attendance.card'),
  biometricCardsController.getCardByEmployee
);

router.get(
  '/',
  requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  requireFeature('attendance.card'),
  biometricCardsController.listCards
);

router.get(
  '/:id/download',
  requireRole('EMPLOYEE', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  requireFeature('attendance.card'),
  biometricCardsController.downloadCard
);

export default router;
