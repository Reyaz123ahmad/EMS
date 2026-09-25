import { Router } from 'express';
import { fingerAttendanceController } from './finger-attendance.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authenticateDevice } from '../../middlewares/device-auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireFeature, requireActiveSubscription } from '../../middlewares/subscription.middleware.js';


const router = Router();

// 1. Hardware Push Punch (Device x-api-key authentication)
router.post('/punch', authenticateDevice, fingerAttendanceController.receiveFingerPunch);

// 2. Authenticated Management Routes
router.post(
  '/enroll',
  authenticate,
  requireActiveSubscription,
  requireRole(['HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  requireFeature('attendance.finger'),
  fingerAttendanceController.enrollFinger
);

router.delete(
  '/enroll/:employeeId/:fingerIndex',
  authenticate,
  requireActiveSubscription,
  requireRole(['HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  requireFeature('attendance.finger'),
  fingerAttendanceController.deleteFingerEnrollment
);

router.get(
  '/enroll/:employeeId',
  authenticate,
  requireActiveSubscription,
  requireRole(['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  requireFeature('attendance.finger'),
  fingerAttendanceController.getEmployeeEnrollments
);

router.post(
  '/punch/:id/process',
  authenticate,
  requireActiveSubscription,
  requireRole(['HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  requireFeature('attendance.finger'),
  fingerAttendanceController.processFingerPunch
);

router.post(
  '/sync/:deviceId',
  authenticate,
  requireActiveSubscription,
  requireRole(['HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  requireFeature('attendance.finger'),
  fingerAttendanceController.syncToDevice
);

router.get(
  '/punches',
  authenticate,
  requireActiveSubscription,
  requireRole(['HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  requireFeature('attendance.finger'),
  fingerAttendanceController.listFingerPunches
);

router.get(
  '/stats',
  authenticate,
  requireActiveSubscription,
  requireRole(['HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  requireFeature('attendance.finger'),
  fingerAttendanceController.getStats
);

export default router;
