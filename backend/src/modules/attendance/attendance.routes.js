import { Router } from 'express';
import attendanceController, {
  getMonthlySummary,
  getExceptions,
  getStats,
  getOvertimeTracker,
  getShiftRoster,
  getFraudSignals,
  getQrScanner,
  getLiveLocation
} from './attendance.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription, requireFeature } from '../../middlewares/subscription.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

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
  cacheResponse('cache:attendance_today', 60),
  attendanceController.getTodayStatus
);

// Advanced Checkout & Break Polling
router.get(
  '/checkout-status',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  cacheResponse('cache:attendance_checkout_status', 60),
  attendanceController.getCheckoutStatus
);

router.get(
  '/break-status',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  cacheResponse('cache:attendance_break_status', 60),
  attendanceController.getBreakStatus
);

// Management Logs, Reports & Dashboards
router.get(
  '/logs',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  cacheResponse('cache:attendance_logs', 60),
  attendanceController.listLogs
);

// Allowed for all authenticated
router.get('/monthly-summary', authenticate, cacheResponse('cache:attendance_monthly_summary', 60), getMonthlySummary);
router.get('/exceptions', authenticate, cacheResponse('cache:attendance_exceptions', 60), getExceptions);
router.get('/stats', authenticate, cacheResponse('cache:attendance_stats', 60), getStats);
router.get('/overtime-tracker', authenticate, cacheResponse('cache:attendance_overtime_tracker', 60), getOvertimeTracker);
router.get('/shift-roster', authenticate, cacheResponse('cache:attendance_shift_roster', 60), getShiftRoster);
router.get('/fraud-signals', authenticate, cacheResponse('cache:attendance_fraud_signals', 60), getFraudSignals);
router.get('/qr-scanner', authenticate, cacheResponse('cache:attendance_qr_scanner', 60), getQrScanner);
router.get('/live-location', authenticate, cacheResponse('cache:attendance_live_loc', 60), getLiveLocation);

router.get(
  '/calendar',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  cacheResponse('cache:attendance_calendar', 60),
  attendanceController.getCalendar
);

router.get(
  '/employee-summary',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  cacheResponse('cache:attendance_employee_summary', 60),
  attendanceController.getEmployeeSummary
);

router.get(
  '/summary',
  requireRole('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  cacheResponse('cache:attendance_summary', 60),
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

router.put(
  '/policy',
  requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.updatePolicy
);

router.post(
  '/mark-absentees',
  requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.markAbsentees
);

router.post(
  '/fraud-signals/:id/review',
  requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'),
  attendanceController.reviewFraudSignal
);

export default router;
