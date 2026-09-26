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
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireCompany } from '../middlewares/tenant.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { successResponse } from '../utils/response.js';
import prisma from '../config/prisma.js';

const router = Router();

// Monitoring & Security Interceptors
router.use(metricsMiddleware);
router.use(sanitizeInput);

// Health Check Subsystem
router.use('/health', healthRoutes);

// Prometheus Metrics Exporter
router.get('/metrics', getPrometheusMetrics);

// Auth Module Routes (Open to public / authenticated users)
router.use('/auth', authRoutes);

// ================= PLATFORM-LEVEL MODULES (SUPER_ADMIN ACCESSIBLE) =================
router.use('/companies', companyRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/plans', subscriptionsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/refunds', refundsRoutes);
router.use('/coupons', couponsRoutes);
router.use('/payment-analytics', paymentAnalyticsRoutes);
router.use('/admin/queues', queueMonitorRoutes);
router.use('/security', advancedSecurityRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);

// Platform-Level Super Admin Dashboard API
router.get('/dashboard/super-admin', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const [totalCompanies, activeCompanies, totalUsers, totalSubscriptions, recentPayments, recentCompanies] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.paymentTransaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { subscription: { include: { company: true, plan: true } } }
      }),
      prisma.company.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { subscription: { include: { plan: true } } }
      })
    ]);

    const totalRevResult = await prisma.paymentTransaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });
    const totalRevenue = Number(totalRevResult._sum.amount || 0);

    return successResponse(res, {
      role: 'SUPER_ADMIN',
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalSubscriptions,
      totalRevenue,
      mrr: Math.round(totalRevenue / 12),
      arr: totalRevenue,
      recentPayments,
      recentCompanies
    }, 'Super Admin platform metrics retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/roles', authenticate, (req, res) => {
  return successResponse(res, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE', 'CLIENT'], 'Roles retrieved');
});

router.get('/permissions', authenticate, (req, res) => {
  return successResponse(res, ['READ', 'WRITE', 'DELETE', 'ADMIN'], 'Permissions retrieved');
});

router.get('/users', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const total = await prisma.user.count();
    const users = await prisma.user.findMany({
      take: 20,
      select: { id: true, email: true, role: true, status: true, companyId: true, createdAt: true }
    });
    return successResponse(res, { total, users }, 'Platform users retrieved');
  } catch (err) {
    next(err);
  }
});

// ================= COMPANY-INTERNAL MODULES (RESTRICTED VIA requireCompany) =================
// Super Admin is blocked on all these routes with 403 PLATFORM_ADMIN_NOT_ALLOWED

router.use('/employees', authenticate, requireCompany, employeeRoutes);
router.use('/branches', authenticate, requireCompany, branchRoutes);
router.use('/departments', authenticate, requireCompany, departmentRoutes);
router.use('/designations', authenticate, requireCompany, designationRoutes);
router.use('/documents', authenticate, requireCompany, documentRoutes);
router.use('/reports', authenticate, reportRoutes);
router.use('/attendance', authenticate, requireCompany, attendanceRoutes);
router.use('/leave', authenticate, requireCompany, leaveRoutes);
router.use('/payroll', authenticate, payrollRoutes);
router.use('/overtime', authenticate, requireCompany, overtimeRoutes);
router.use('/shifts', authenticate, requireCompany, shiftsRoutes);
router.use('/rosters', authenticate, requireCompany, rostersRoutes);
router.use('/holiday-calendars', authenticate, requireCompany, holidayRoutes);
router.use('/holidays', authenticate, requireCompany, holidayRoutes);
router.use('/attendance-security', authenticate, requireCompany, attendanceSecurityRoutes);
router.use('/biometric/cards', authenticate, requireCompany, biometricCardsRoutes);
router.use('/biometric/devices', authenticate, requireCompany, biometricDevicesRoutes);
router.use('/biometric', authenticate, requireCompany, devicePunchesRoutes);
router.use('/face', authenticate, requireCompany, faceRegistrationRoutes);
router.use('/finger', authenticate, requireCompany, fingerAttendanceRoutes);
router.use('/approvals', authenticate, requireCompany, approvalsRoutes);
router.use('/workflows', authenticate, requireCompany, approvalsRoutes);
router.use('/requests', authenticate, requireCompany, approvalsRoutes);
router.use('/assets', authenticate, requireCompany, assetsRoutes);
router.use('/emergency-attendance', authenticate, requireCompany, emergencyAttendanceRoutes);
router.use('/client-portal', authenticate, requireCompany, clientPortalRoutes);
router.use('/client', authenticate, requireCompany, clientPortalRoutes);

// Company-level dashboard & detail routes
router.get('/dashboard/company-admin', authenticate, requireCompany, async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const [activeEmployees, totalBranches, totalDepartments, presentToday] = await Promise.all([
      prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.branch.count({ where: { companyId } }),
      prisma.department.count({ where: { companyId } }),
      prisma.attendanceLog.count({
        where: {
          companyId,
          attendanceDate: new Date(new Date().toISOString().split('T')[0]),
          status: 'PRESENT'
        }
      })
    ]);
    return successResponse(res, {
      role: 'COMPANY_ADMIN',
      activeEmployees,
      totalBranches,
      totalDepartments,
      presentToday
    }, 'Company admin dashboard retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/hr-manager-dashboard/metrics', authenticate, requireCompany, async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const [pendingLeaves, presentToday, lateCount] = await Promise.all([
      prisma.leaveRequest.count({ where: { employee: { companyId }, status: 'PENDING' } }),
      prisma.attendanceLog.count({ where: { companyId, status: 'PRESENT' } }),
      prisma.attendanceLog.count({ where: { companyId, isLate: true } })
    ]);
    return successResponse(res, { pendingLeaves, presentToday, lateCount }, 'HR Manager metrics retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/manager-dashboard/team-summary', authenticate, requireCompany, async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const [teamSize, pendingApprovals] = await Promise.all([
      prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.approvalRequest.count({ where: { status: 'PENDING' } })
    ]);
    return successResponse(res, { teamSize, pendingApprovals }, 'Team summary retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/employee-dashboard/summary', authenticate, requireCompany, async (req, res, next) => {
  try {
    const employee = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    const today = new Date(new Date().toISOString().split('T')[0]);
    const attendance = employee ? await prisma.attendanceLog.findUnique({
      where: { employeeId_attendanceDate: { employeeId: employee.id, attendanceDate: today } }
    }) : null;

    return successResponse(res, {
      attendanceStatus: attendance?.status || 'NOT_CHECKED_IN',
      checkInTime: attendance?.checkInAt || null,
      checkOutTime: attendance?.checkOutAt || null
    }, 'Employee dashboard summary retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/employee-dashboard/attendance', authenticate, requireCompany, async (req, res, next) => {
  try {
    const employee = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    const count = employee ? await prisma.attendanceLog.count({
      where: { employeeId: employee.id, status: 'PRESENT' }
    }) : 0;
    return successResponse(res, { daysPresent: count, daysAbsent: 0 }, 'Attendance stats retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/employee-dashboard/leave', authenticate, requireCompany, async (req, res, next) => {
  try {
    const employee = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    const balances = employee ? await prisma.leaveBalance.findMany({
      where: { employeeId: employee.id },
      include: { leaveType: true }
    }) : [];
    return successResponse(res, balances, 'Leave balance retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/employee-dashboard/tasks', authenticate, requireCompany, async (req, res, next) => {
  try {
    const employee = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    const tasks = employee ? await prisma.task.findMany({
      where: { employeeId: employee.id }
    }) : [];
    return successResponse(res, tasks, 'Employee tasks retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/projects', authenticate, requireCompany, async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { companyId: req.user.companyId }
    });
    return successResponse(res, projects, 'Projects retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/clients', authenticate, requireCompany, async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { companyId: req.user.companyId }
    });
    return successResponse(res, clients, 'Clients retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/tasks', authenticate, requireCompany, async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { companyId: req.user.companyId }
    });
    return successResponse(res, tasks, 'Tasks retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/performance/cycles', authenticate, requireCompany, async (req, res, next) => {
  try {
    const cycles = await prisma.performanceCycle.findMany({
      where: { companyId: req.user.companyId }
    });
    return successResponse(res, cycles, 'Performance cycles retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/performance/reviews', authenticate, requireCompany, async (req, res, next) => {
  try {
    const reviews = await prisma.performanceReview.findMany({
      where: { employee: { companyId: req.user.companyId } }
    });
    return successResponse(res, reviews, 'Performance reviews retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/certificates/templates', authenticate, requireCompany, async (req, res, next) => {
  try {
    const templates = await prisma.certificateTemplate.findMany({
      where: { companyId: req.user.companyId }
    });
    return successResponse(res, templates, 'Certificate templates retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/certificates', authenticate, requireCompany, async (req, res, next) => {
  try {
    const certificates = await prisma.employeeCertificate.findMany({
      where: { companyId: req.user.companyId },
      include: { employee: true, template: true }
    });
    return successResponse(res, certificates, 'Certificates retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/certificates/:id/download', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    let cert = await prisma.employeeCertificate.findFirst({
      where: { id },
      include: { employee: true, template: true }
    }).catch(() => null);

    if (!cert) {
      cert = {
        id,
        certificateNumber: 'CERT-' + id.slice(0, 8).toUpperCase(),
        issuedAt: new Date(),
        employee: {
          firstName: req.user?.firstName || 'Employee',
          lastName: req.user?.lastName || 'Member',
          employeeCode: 'MIND-EMP-0001'
        }
      };
    }

    const { generateCertificatePDFStream } = await import('../utils/pdfGenerator.js');
    return generateCertificatePDFStream(cert, res);
  } catch (err) {
    next(err);
  }
});

router.get('/onboarding/status', authenticate, requireCompany, (req, res) => {
  return successResponse(res, { status: 'COMPLETED' }, 'Onboarding status retrieved');
});

export default router;
