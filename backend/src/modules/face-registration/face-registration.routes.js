import { Router } from 'express';
import { faceRegistrationController } from './face-registration.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireFeature, requireActiveSubscription } from '../../middlewares/subscription.middleware.js';


const router = Router();

// Base middleware for all routes
router.use(authenticate);
router.use(requireActiveSubscription);
router.use(requireFeature('attendance.face'));

// 1. Face Registration & Updates
router.post(
  '/register',
  requireRole(['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.registerFace
);

router.get(
  '/my-status',
  requireRole(['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.getMyStatus
);

router.get(
  '/pending',
  requireRole(['HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.listPending
);

router.post(
  '/:id/approve',
  requireRole(['HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.approveRequest
);

router.post(
  '/:id/reject',
  requireRole(['HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.rejectRequest
);

router.put(
  '/update',
  requireRole(['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.updateFace
);

router.delete(
  '/delete',
  requireRole(['HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.deleteFace
);

// 2. Verification
router.post(
  '/verify',
  requireRole(['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.verifyFace
);

// 3. Status & Queries
router.get(
  '/status/:employeeId',
  requireRole(['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.getFaceStatus
);

router.get(
  '/with-face',
  requireRole(['HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.listWithFace
);

router.get(
  '/without-face',
  requireRole(['HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.listWithoutFace
);

// 4. Batch Operations & Stats
router.post(
  '/bulk-register',
  requireRole(['HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.bulkRegister
);

router.get(
  '/stats',
  requireRole(['HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.getStats
);

router.get(
  '/export',
  requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']),
  faceRegistrationController.exportEmbeddings
);

export default router;
