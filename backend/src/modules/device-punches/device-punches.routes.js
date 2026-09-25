import { Router } from 'express';
import { devicePunchesController } from './device-punches.controller.js';
import { authenticateDevice } from '../../middlewares/device-auth.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription, requireFeature } from '../../middlewares/subscription.middleware.js';

const router = Router();

// Device push punch endpoint (authenticated via Device API Key)
router.post('/push', authenticateDevice, devicePunchesController.receivePunch);

// Admin / Management endpoints (require user JWT authentication)
router.get(
  '/punches',
  authenticate,
  requireActiveSubscription,
  requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  requireFeature('attendance.finger'),
  devicePunchesController.listPunches
);

router.post(
  '/punches/:id/reprocess',
  authenticate,
  requireActiveSubscription,
  requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  requireFeature('attendance.finger'),
  devicePunchesController.reprocessPunch
);

router.get(
  '/stats',
  authenticate,
  requireActiveSubscription,
  requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  requireFeature('attendance.finger'),
  devicePunchesController.getStats
);

export default router;
