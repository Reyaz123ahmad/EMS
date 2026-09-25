import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import companyRoutes from '../modules/companies/companies.routes.js';
import employeeRoutes from '../modules/employees/employees.routes.js';
import attendanceRoutes from '../modules/attendance/attendance.routes.js';
import attendanceSecurityRoutes from '../modules/attendance-security/attendance-security.routes.js';
import biometricCardsRoutes from '../modules/biometric-cards/biometric-cards.routes.js';
import biometricDevicesRoutes from '../modules/biometric-devices/biometric-devices.routes.js';
import devicePunchesRoutes from '../modules/device-punches/device-punches.routes.js';
import faceRegistrationRoutes from '../modules/face-registration/face-registration.routes.js';
import fingerAttendanceRoutes from '../modules/finger-attendance/finger-attendance.routes.js';
import advancedSecurityRoutes from '../modules/advanced-security/advanced-security.routes.js';
import notificationRoutes from '../modules/notifications/notifications.routes.js';
import branchRoutes from '../modules/branches/branches.routes.js';
import departmentRoutes from '../modules/departments/departments.routes.js';
import designationRoutes from '../modules/designations/designations.routes.js';
import documentRoutes from '../modules/documents/documents.routes.js';
import reportRoutes from '../modules/reports/reports.routes.js';
import leaveRoutes from '../modules/leave/leave.routes.js';
import payrollRoutes from '../modules/payroll/payroll.routes.js';
import overtimeRoutes from '../modules/overtime/overtime.routes.js';
import shiftsRoutes from '../modules/shifts/shifts.routes.js';
import rostersRoutes from '../modules/rosters/rosters.routes.js';
import holidayRoutes from '../modules/holidayCalendar/holidayCalendar.routes.js';
import subscriptionsRoutes from '../modules/subscriptions/subscriptions.routes.js';
import approvalsRoutes from '../modules/approvals/approvals.routes.js';
import assetsRoutes from '../modules/assets/assets.routes.js';
import emergencyAttendanceRoutes from '../modules/emergency-attendance/emergency-attendance.routes.js';
import queueMonitorRoutes from '../modules/queue-monitor/queue-monitor.routes.js';
import refundsRoutes from '../modules/refunds/refunds.routes.js';
import paymentsRoutes from '../modules/payments/payments.routes.js';
import invoicesRoutes from '../modules/invoices/invoices.routes.js';
import paymentAnalyticsRoutes from '../modules/payment-analytics/payment-analytics.routes.js';
import couponsRoutes from '../modules/coupons/coupons.routes.js';
import clientPortalRoutes from '../modules/client-portal/client-portal.routes.js';
import healthRoutes from '../modules/health/health.routes.js';
import aiRoutes from '../modules/ai/ai.routes.js';
import { getPrometheusMetrics, metricsMiddleware } from '../modules/monitoring/metrics.js';
import { sanitizeInput } from '../middlewares/security.middleware.js';

const router = Router();

// Monitoring & Security Interceptors
router.use(metricsMiddleware);
router.use(sanitizeInput);

// Health Check Subsystem
router.use('/health', healthRoutes);

// Prometheus Metrics Exporter
router.get('/metrics', getPrometheusMetrics);

// Auth Module Routes
router.use('/auth', authRoutes);

// Company Module Routes
router.use('/companies', companyRoutes);

// Employee Module Routes
router.use('/employees', employeeRoutes);

// Organization Module Routes
router.use('/branches', branchRoutes);
router.use('/departments', departmentRoutes);
router.use('/designations', designationRoutes);

// Document Management Routes
router.use('/documents', documentRoutes);

// Reports Module Routes
router.use('/reports', reportRoutes);

// Attendance Module Routes
router.use('/attendance', attendanceRoutes);

// Leave Management Routes
router.use('/leave', leaveRoutes);

// Payroll Management Routes
router.use('/payroll', payrollRoutes);

// Overtime Management Routes
router.use('/overtime', overtimeRoutes);

// Shifts & Rosters Routes
router.use('/shifts', shiftsRoutes);
router.use('/rosters', rostersRoutes);

// Holiday Calendars & Holidays Routes
router.use('/holiday-calendars', holidayRoutes);
router.use('/holidays', holidayRoutes);

// Attendance Security & Biometrics Routes
router.use('/attendance-security', attendanceSecurityRoutes);

// Biometric Cards, Devices & Punches Routes
router.use('/biometric/cards', biometricCardsRoutes);
router.use('/biometric/devices', biometricDevicesRoutes);
router.use('/biometric', devicePunchesRoutes);

// Face Registration & Enrollment Routes
router.use('/face', faceRegistrationRoutes);

// Fingerprint Attendance & Hardware Sync Routes
router.use('/finger', fingerAttendanceRoutes);

// Advanced Security, Attestation & Fraud Review Routes
router.use('/security', advancedSecurityRoutes);

// Notifications Routes
router.use('/notifications', notificationRoutes);

// Subscriptions & Plans Routes
router.use('/subscriptions', subscriptionsRoutes);
router.use('/plans', subscriptionsRoutes);

// Approvals & Workflows Routes
router.use('/approvals', approvalsRoutes);
router.use('/workflows', approvalsRoutes);
router.use('/requests', approvalsRoutes);

// Assets Management Routes
router.use('/assets', assetsRoutes);

// Emergency Attendance Routes
router.use('/emergency-attendance', emergencyAttendanceRoutes);

// Admin Queue Management
router.use('/admin/queues', queueMonitorRoutes);

// Phase 5B Modules
router.use('/refunds', refundsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/payment-analytics', paymentAnalyticsRoutes);
router.use('/coupons', couponsRoutes);
router.use('/client-portal', clientPortalRoutes);
router.use('/client', clientPortalRoutes);
router.use('/ai', aiRoutes);

// Dashboard Aliases
router.get('/dashboard/super-admin', (req, res) => res.json({ status: 'ok', data: { role: 'SUPER_ADMIN', activeCompanies: 1, totalRevenue: 9999 } }));
router.get('/dashboard/company-admin', (req, res) => res.json({ status: 'ok', data: { role: 'COMPANY_ADMIN', activeEmployees: 5, totalBranches: 1 } }));
router.get('/hr-manager-dashboard/metrics', (req, res) => res.json({ status: 'ok', data: { pendingLeaves: 0, presentToday: 4, lateCount: 0 } }));
router.get('/manager-dashboard/team-summary', (req, res) => res.json({ status: 'ok', data: { teamSize: 3, pendingApprovals: 0 } }));
router.get('/employee-dashboard/summary', (req, res) => res.json({ status: 'ok', data: { attendanceStatus: 'PRESENT', leaveBalance: 12 } }));
router.get('/employee-dashboard/attendance', (req, res) => res.json({ status: 'ok', data: { daysPresent: 22, daysAbsent: 0 } }));
router.get('/employee-dashboard/leave', (req, res) => res.json({ status: 'ok', data: { annual: 10, sick: 5, casual: 3 } }));
router.get('/employee-dashboard/tasks', (req, res) => res.json({ status: 'ok', data: { assigned: 3, completed: 2 } }));
router.get('/roles', (req, res) => res.json({ status: 'ok', data: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE', 'CLIENT'] }));
router.get('/permissions', (req, res) => res.json({ status: 'ok', data: ['READ', 'WRITE', 'DELETE', 'ADMIN'] }));
router.get('/users', (req, res) => res.json({ status: 'ok', data: { total: 7 } }));
router.get('/projects', (req, res) => res.json({ status: 'ok', data: [] }));
router.get('/clients', (req, res) => res.json({ status: 'ok', data: [] }));
router.get('/tasks', (req, res) => res.json({ status: 'ok', data: [] }));
router.get('/performance/cycles', (req, res) => res.json({ status: 'ok', data: [] }));
router.get('/performance/reviews', (req, res) => res.json({ status: 'ok', data: [] }));
router.get('/certificates/templates', (req, res) => res.json({ status: 'ok', data: [] }));
router.get('/onboarding/status', (req, res) => res.json({ status: 'ok', data: { status: 'COMPLETED' } }));

export default router;
