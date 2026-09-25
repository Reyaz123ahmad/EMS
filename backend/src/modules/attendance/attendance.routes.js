import { Router } from 'express';
import attendanceController from './attendance.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription, requireFeature } from '../../middlewares/subscription.middleware.js';

const router = Router();

// Apply authentication & active subscription checks to all attendance routes
router.use(authenticate);
router.use(requireActiveSubscription);

// Core 4 Attendance Operations
router.post(
  '/check-in',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'),
  attendanceController.checkIn
);

router.post(
  '/check-out',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'),
  attendanceController.checkOut
);

router.post(
  '/break-start',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'),
  attendanceController.startBreak
);

router.post(
  '/break-end',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'),
  attendanceController.endBreak
);

// Card QR Attendance Scan
router.post(
  '/card-scan',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  requireFeature('attendance.card'),
  attendanceController.cardScan
);

// Realtime Employee Status
router.get(
  '/today',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.getTodayStatus
);

// Advanced Checkout & Break Polling
router.get(
  '/checkout-status',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.getCheckoutStatus
);

router.get(
  '/break-status',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.getBreakStatus
);

// Management Logs, Reports & Dashboards
router.get(
  '/logs',
  requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.listLogs
);

router.get(
  '/monthly-summary',
  requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.getMonthlySummary
);

router.get(
  '/calendar',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.getCalendar
);

router.get(
  '/employee-summary',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.getEmployeeSummary
);

router.get(
  '/summary',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.getEmployeeSummary
);


router.post(
  '/manual',
  requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.markManual
);

router.post(
  '/bulk-mark',
  requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.bulkMark
);

router.get(
  '/exceptions',
  requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.getExceptions
);

router.put(
  '/policy',
  requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.updatePolicy
);

router.get(
  '/stats',
  requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.getStats
);

// Fraud Signals Review & Audit
router.get(
  '/fraud-signals',
  requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.listFraudSignals
);

router.post(
  '/fraud-signals/:id/review',
  requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.reviewFraudSignal
);

export default router;
