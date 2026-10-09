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
import breaksRoutes from '../modules/breaks/breaks.routes.js';
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
import projectsRoutes from '../modules/projects/projects.routes.js';
import tasksRoutes from '../modules/tasks/tasks.routes.js';
import healthRoutes from '../modules/health/health.routes.js';
import aiRoutes from '../modules/ai/ai.routes.js';
import { getPrometheusMetrics, metricsMiddleware } from '../modules/monitoring/metrics.js';
import { sanitizeInput } from '../middlewares/security.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireCompany } from '../middlewares/tenant.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';
import { successResponse } from '../utils/response.js';
import prisma from '../config/prisma.js';
import { getAuthEmployeeId, getAuthEmployee, getManagerTeamIds, getAuthClientId } from '../security/data-scope.js';
import crypto from 'crypto';
import { hashPassword } from '../security/password.js';
import { addCredentialsEmail } from '../queues/email.queue.js';

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

// ================= ANALYTICS & TREND HELPERS (OPTIMIZED WITH MEMORY CACHING) =================
const trendMemoryCache = new Map();

function getTrendCache(key) {
  const item = trendMemoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    trendMemoryCache.delete(key);
    return null;
  }
  return item.value;
}

function setTrendCache(key, value, ttlSeconds = 60) {
  trendMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });
}

async function get6MonthCompanyGrowthTrend() {
  const cacheKey = 'trend:growth:6m';
  const cached = getTrendCache(cacheKey);
  if (cached) return cached;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [totalCompaniesBefore, newCompanies] = await Promise.all([
    prisma.company.count({ where: { createdAt: { lt: sixMonthsAgo } } }).catch(() => 0),
    prisma.company.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    }).catch(() => [])
  ]);

  let runningTotal = totalCompaniesBefore;
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthName = months[d.getMonth()];

    const monthNew = newCompanies.filter(c => c.createdAt >= startOfMonth && c.createdAt <= endOfMonth).length;
    runningTotal += monthNew;
    result.push({ month: monthName, companies: runningTotal });
  }

  setTrendCache(cacheKey, result, 60);
  return result;
}

async function get6MonthRevenueTrend() {
  const cacheKey = 'trend:revenue:6m';
  const cached = getTrendCache(cacheKey);
  if (cached) return cached;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const transactions = await prisma.paymentTransaction.findMany({
    where: {
      status: 'SUCCESS',
      createdAt: { gte: sixMonthsAgo }
    },
    select: { createdAt: true, amount: true }
  }).catch(() => []);

  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthName = months[d.getMonth()];

    const monthRev = transactions
      .filter(t => t.createdAt >= startOfMonth && t.createdAt <= endOfMonth)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    result.push({ month: monthName, revenue: monthRev });
  }

  setTrendCache(cacheKey, result, 60);
  return result;
}

async function get7DayAttendanceTrend(companyId, employeeIds = null) {
  const cacheKey = `trend:att:7d:${companyId}:${employeeIds ? employeeIds.sort().join(',') : 'all'}`;
  const cached = getTrendCache(cacheKey);
  if (cached) return cached;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [activeCount, logs] = await Promise.all([
    employeeIds ? Promise.resolve(employeeIds.length) : prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }).catch(() => 1),
    prisma.attendanceLog.findMany({
      where: {
        companyId,
        attendanceDate: { gte: sevenDaysAgo },
        ...(employeeIds && employeeIds.length > 0 ? { employeeId: { in: employeeIds } } : {})
      },
      select: {
        attendanceDate: true,
        status: true,
        isLate: true
      }
    }).catch(() => [])
  ]);

  const safeActive = Math.max(1, activeCount || 1);

  // Group logs by YYYY-MM-DD
  const logsByDate = {};
  for (const log of logs) {
    const dStr = log.attendanceDate instanceof Date 
      ? log.attendanceDate.toISOString().split('T')[0] 
      : String(log.attendanceDate).split('T')[0];
    if (!logsByDate[dStr]) logsByDate[dStr] = { present: 0, late: 0 };
    if (['PRESENT', 'LATE', 'HALF_DAY'].includes(log.status)) {
      logsByDate[dStr].present++;
    }
    if (log.status === 'LATE' || log.isLate) {
      logsByDate[dStr].late++;
    }
  }

  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = days[d.getDay()];
    const totalPresent = logsByDate[dateStr]?.present || 0;
    const totalLate = logsByDate[dateStr]?.late || 0;

    result.push({
      date: dateStr,
      day: dayName,
      present: Math.min(100, Math.round((totalPresent / safeActive) * 100)),
      late: Math.min(100, Math.round((totalLate / safeActive) * 100)),
      presentCount: totalPresent,
      lateCount: totalLate
    });
  }

  setTrendCache(cacheKey, result, 60);
  return result;
}

// Platform-Level Super Admin Dashboard API
router.get('/dashboard/super-admin', authenticate, requireRole('SUPER_ADMIN'), cacheResponse('cache:super_admin_dash', 120), async (req, res, next) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalSubscriptions,
      recentPayments,
      recentCompanies,
      companyGrowthTrend,
      monthlyRevenueTrend
    ] = await Promise.all([
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
      }),
      get6MonthCompanyGrowthTrend(),
      get6MonthRevenueTrend()
    ]);

    const totalRevResult = await prisma.paymentTransaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    }).catch(() => ({ _sum: { amount: 0 } }));
    const totalRevenue = Number(totalRevResult?._sum?.amount || 0);

    const formattedCompanies = recentCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      companyCode: c.companyCode || c.id,
      planName: c.subscription?.plan?.name || 'No Plan',
      status: c.status,
      joinedAt: c.createdAt,
      createdAt: c.createdAt,
      subscription: c.subscription
    }));

    return successResponse(res, {
      role: 'SUPER_ADMIN',
      totalCompanies: totalCompanies || 0,
      activeCompanies: activeCompanies || 0,
      companies: {
        total: totalCompanies || 0,
        active: activeCompanies || 0
      },
      totalUsers: totalUsers || 0,
      users: totalUsers || 0,
      totalSubscriptions: totalSubscriptions || 0,
      totalRevenue: totalRevenue || 0,
      revenue: totalRevenue || 0,
      mrr: Math.round(totalRevenue / 12) || 0,
      arr: totalRevenue || 0,
      companyGrowthTrend,
      monthlyRevenueTrend,
      recentPayments,
      recentCompanies: formattedCompanies
    }, 'Super Admin platform metrics retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/roles', authenticate, cacheResponse('cache:roles', 60), async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { companyId: null },
          { companyId: req.user?.companyId || null }
        ],
        name: { notIn: ['SUPER_ADMIN', 'CLIENT'] }
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });
    return successResponse(res, roles, 'Roles retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/permissions', authenticate, cacheResponse('cache:permissions', 3600), (req, res) => {
  return successResponse(res, ['READ', 'WRITE', 'DELETE', 'ADMIN'], 'Permissions retrieved');
});

router.get('/users', authenticate, requireRole('SUPER_ADMIN'), cacheResponse('cache:users', 120), async (req, res, next) => {
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
router.use('/employee-documents', authenticate, requireCompany, documentRoutes);
router.use('/reports', authenticate, reportRoutes);
router.use('/attendance', authenticate, requireCompany, attendanceRoutes);
router.use('/leave', authenticate, requireCompany, leaveRoutes);
router.use('/payroll', authenticate, payrollRoutes);
router.use('/overtime', authenticate, requireCompany, overtimeRoutes);
router.use('/shifts', authenticate, requireCompany, shiftsRoutes);
router.use('/breaks', authenticate, requireCompany, breaksRoutes);
router.use('/rosters', authenticate, requireCompany, rostersRoutes);
router.use('/holiday-calendars', authenticate, requireCompany, holidayRoutes);
router.use('/holidays', authenticate, requireCompany, holidayRoutes);
router.use('/attendance-security', authenticate, requireCompany, attendanceSecurityRoutes);
router.use('/biometric-cards', authenticate, requireCompany, biometricCardsRoutes);
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

// In-memory cache for dashboards
const companyAdminDashCache = new Map();

// Company-level dashboard & detail routes
router.get('/dashboard/company-admin', authenticate, requireCompany, cacheResponse('cache:company_admin_dash', 60), async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const cached = companyAdminDashCache.get(companyId);
    if (cached && Date.now() < cached.expiresAt) {
      return successResponse(res, cached.data, 'Company admin dashboard retrieved');
    }

    const today = new Date(new Date().toISOString().split('T')[0]);

    const [metricsResult, todayAttendanceLogs, pendingApprovals, recentActivity, attendanceTrend] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          (SELECT COUNT(*)::int FROM employees WHERE "companyId" = ${companyId}) as "totalEmployees",
          (SELECT COUNT(*)::int FROM employees WHERE "companyId" = ${companyId} AND "status" = 'ACTIVE') as "activeEmployees",
          (SELECT COUNT(*)::int FROM branches WHERE "companyId" = ${companyId}) as "totalBranches",
          (SELECT COUNT(*)::int FROM departments WHERE "companyId" = ${companyId}) as "totalDepartments",
          (SELECT COUNT(*)::int FROM leave_requests WHERE "status" = 'APPROVED' AND "startDate" <= NOW() AND "endDate" >= NOW() AND "employeeId" IN (SELECT id FROM employees WHERE "companyId" = ${companyId})) as "onLeaveToday",
          (SELECT COALESCE(SUM(budget), 0)::float FROM projects WHERE "companyId" = ${companyId}) as "totalBudget"
      `.catch(() => [{ totalEmployees: 0, activeEmployees: 0, totalBranches: 0, totalDepartments: 0, onLeaveToday: 0, totalBudget: 0 }]),
      prisma.attendanceLog.findMany({
        where: { companyId, attendanceDate: today },
        select: { status: true, isLate: true }
      }).catch(() => []),
      prisma.approvalRequest.findMany({
        where: { workflow: { companyId }, status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, entityType: true, entityId: true, createdAt: true, workflow: { select: { name: true } } }
      }).catch(() => []),
      prisma.auditLog.findMany({
        where: { user: { companyId } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, action: true, entity: true, createdAt: true }
      }).catch(() => []),
      get7DayAttendanceTrend(companyId)
    ]);

    const counts = metricsResult[0] || {};
    const totalEmployees = Number(counts.totalEmployees || 0);
    const activeEmployees = Number(counts.activeEmployees || 0);
    const totalBranches = Number(counts.totalBranches || 0);
    const totalDepartments = Number(counts.totalDepartments || 0);
    const onLeaveToday = Number(counts.onLeaveToday || 0);
    const clientRevenue = Number(counts.totalBudget || 0);
    const subscriptionExpense = 0;

    const presentToday = todayAttendanceLogs.filter(l => ['PRESENT', 'LATE', 'HALF_DAY'].includes(l.status)).length;
    const lateToday = todayAttendanceLogs.filter(l => l.status === 'LATE' || l.isLate).length;
    const absentToday = Math.max(0, activeEmployees - presentToday - onLeaveToday);

    const attendanceBreakdown = [
      { name: 'Present', value: presentToday, color: '#10b981' },
      { name: 'Late', value: lateToday, color: '#f59e0b' },
      { name: 'On Leave', value: onLeaveToday, color: '#6366f1' },
      { name: 'Absent', value: absentToday, color: '#f43f5e' }
    ];

    const resultData = {
      role: 'COMPANY_ADMIN',
      totalEmployees: totalEmployees || 0,
      activeEmployees: activeEmployees || 0,
      totalBranches: totalBranches || 0,
      totalDepartments: totalDepartments || 0,
      presentToday,
      lateToday,
      onLeaveToday: onLeaveToday || 0,
      absentToday,
      totalRevenue: clientRevenue,
      totalExpense: subscriptionExpense,
      netIncome: clientRevenue - subscriptionExpense,
      finance: {
        revenue: clientRevenue,
        expense: subscriptionExpense,
        netIncome: clientRevenue - subscriptionExpense
      },
      pendingApprovals,
      recentActivity,
      attendanceTrend,
      attendanceBreakdown
    };

    companyAdminDashCache.set(companyId, { data: resultData, expiresAt: Date.now() + 60000 });
    return successResponse(res, resultData, 'Company admin dashboard retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/hr-admin', authenticate, requireCompany, cacheResponse('cache:hr_admin_dash', 60), async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const today = new Date(new Date().toISOString().split('T')[0]);

    const [
      totalEmployees,
      activeEmployees,
      presentToday,
      lateToday,
      onLeaveToday,
      pendingLeaves,
      pendingDocs,
      pendingApprovals,
      attendanceTrend
    ] = await Promise.all([
      prisma.employee.count({ where: { companyId } }).catch(() => 0),
      prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }).catch(() => 0),
      prisma.attendanceLog.count({
        where: { companyId, attendanceDate: today, status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] } }
      }).catch(() => 0),
      prisma.attendanceLog.count({
        where: { companyId, attendanceDate: today, OR: [{ status: 'LATE' }, { isLate: true }] }
      }).catch(() => 0),
      prisma.leaveRequest.count({
        where: {
          employee: { companyId },
          status: 'APPROVED',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      }).catch(() => 0),
      prisma.leaveRequest.findMany({
        where: { employee: { companyId }, status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, startDate: true, endDate: true, reason: true, status: true, employee: { select: { firstName: true, lastName: true } }, leaveType: { select: { name: true } } }
      }).catch(() => []),
      prisma.employeeDocument.findMany({
        where: { employee: { companyId }, status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, fileName: true, status: true, employee: { select: { firstName: true, lastName: true } } }
      }).catch(() => []),
      prisma.approvalRequest.count({
        where: { workflow: { companyId }, status: 'PENDING' }
      }).catch(() => 0),
      get7DayAttendanceTrend(companyId)
    ]);

    const absentToday = Math.max(0, activeEmployees - presentToday - onLeaveToday);

    const attendanceBreakdown = [
      { name: 'Present', value: presentToday, color: '#10b981' },
      { name: 'Late', value: lateToday, color: '#f59e0b' },
      { name: 'On Leave', value: onLeaveToday, color: '#6366f1' },
      { name: 'Absent', value: absentToday, color: '#f43f5e' }
    ];

    return successResponse(res, {
      totalEmployees: totalEmployees || 0,
      activeEmployees: activeEmployees || 0,
      presentToday: presentToday || 0,
      lateToday: lateToday || 0,
      onLeaveToday: onLeaveToday || 0,
      absentToday: absentToday || 0,
      pendingLeaves,
      pendingDocs,
      pendingApprovals,
      attendanceTrend,
      attendanceBreakdown
    }, 'HR Admin dashboard retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/hr-manager', authenticate, requireCompany, cacheResponse('cache:hr_manager_dash', 60), async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const emp = await getAuthEmployee(req);
    const departmentId = emp?.departmentId;
    const today = new Date(new Date().toISOString().split('T')[0]);

    const employeeWhere = { companyId, status: 'ACTIVE' };
    if (departmentId) employeeWhere.departmentId = departmentId;

    const attendanceWhere = { companyId, attendanceDate: today, status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] } };
    if (departmentId) attendanceWhere.employee = { departmentId };

    const lateWhere = { companyId, attendanceDate: today, OR: [{ status: 'LATE' }, { isLate: true }] };
    if (departmentId) lateWhere.employee = { departmentId };

    const [teamSize, presentToday, lateToday, pendingApprovals, teamMembers, attendanceTrend] = await Promise.all([
      prisma.employee.count({ where: employeeWhere }).catch(() => 0),
      prisma.attendanceLog.count({ where: attendanceWhere }).catch(() => 0),
      prisma.attendanceLog.count({ where: lateWhere }).catch(() => 0),
      prisma.approvalRequest.count({ where: { workflow: { companyId }, status: 'PENDING' } }).catch(() => 0),
      prisma.employee.findMany({
        where: departmentId ? { companyId, departmentId } : { companyId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          status: true,
          faceRegisteredAt: true,
          designation: { select: { name: true } },
          attendanceLogs: {
            where: { attendanceDate: today },
            take: 1,
            select: { status: true, checkInAt: true, attendanceMethod: true }
          }
        }
      }).catch(() => []),
      get7DayAttendanceTrend(companyId)
    ]);

    const formattedMembers = teamMembers.map(m => {
      const att = m.attendanceLogs?.[0];
      return {
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        code: m.employeeCode,
        role: m.designation?.name || 'Staff',
        status: att?.status || (m.status === 'ACTIVE' ? 'ABSENT' : m.status),
        inTime: att?.checkInAt ? new Date(att.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        method: att?.attendanceMethod || (m.faceRegisteredAt ? 'Face' : 'Manual')
      };
    });

    return successResponse(res, {
      teamSize: teamSize || 0,
      presentToday: presentToday || 0,
      lateToday: lateToday || 0,
      pendingApprovals: pendingApprovals || 0,
      teamMembers: formattedMembers,
      attendanceTrend
    }, 'HR Manager dashboard metrics retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/manager', authenticate, requireCompany, cacheResponse('cache:manager_dash', 60), async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const emp = await getAuthEmployee(req);
    const teamIds = await getManagerTeamIds(emp?.id);
    const today = new Date(new Date().toISOString().split('T')[0]);

    const [directReports, presentToday, pendingApprovals, tasks, teamMembers, attendanceTrend] = await Promise.all([
      prisma.employee.count({ where: { id: { in: teamIds }, status: 'ACTIVE' } }).catch(() => 0),
      prisma.attendanceLog.count({ where: { companyId, employeeId: { in: teamIds }, attendanceDate: today, status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] } } }).catch(() => 0),
      prisma.approvalRequest.count({ where: { workflow: { companyId }, status: 'PENDING' } }).catch(() => 0),
      prisma.task.findMany({ where: { companyId, employeeId: { in: teamIds } }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, status: true, priority: true } }).catch(() => []),
      prisma.employee.findMany({
        where: { id: { in: teamIds } },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          status: true,
          attendanceLogs: {
            where: { attendanceDate: today },
            take: 1,
            select: { status: true, checkInAt: true, totalWorkedMinutes: true }
          }
        }
      }).catch(() => []),
      get7DayAttendanceTrend(companyId, teamIds)
    ]);

    const formattedTeam = teamMembers.map(m => {
      const att = m.attendanceLogs?.[0];
      return {
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        code: m.employeeCode,
        status: att?.status || (m.status === 'ACTIVE' ? 'ABSENT' : m.status),
        inTime: att?.checkInAt ? new Date(att.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        worked: att?.totalWorkedMinutes ? `${Math.floor(att.totalWorkedMinutes / 60)}h ${att.totalWorkedMinutes % 60}m` : '-'
      };
    });

    return successResponse(res, {
      directReports: directReports || 0,
      presentToday: presentToday || 0,
      pendingTasks: tasks.length || 0,
      pendingApprovals: pendingApprovals || 0,
      tasks,
      teamAttendance: formattedTeam,
      attendanceTrend
    }, 'Manager dashboard retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/employee', authenticate, requireCompany, cacheResponse('cache:emp_dash', 60), async (req, res, next) => {
  try {
    const employee = await getAuthEmployee(req);
    const today = new Date(new Date().toISOString().split('T')[0]);

    const [todayAttendance, monthlyAttendanceCount, leaveBalances, holidays, recentPayroll] = await Promise.all([
      employee ? prisma.attendanceLog.findUnique({
        where: { employeeId_attendanceDate: { employeeId: employee.id, attendanceDate: today } },
        select: { status: true, checkInAt: true, checkOutAt: true, totalWorkedMinutes: true }
      }).catch(() => null) : null,
      employee ? prisma.attendanceLog.count({
        where: { employeeId: employee.id, status: 'PRESENT' }
      }).catch(() => 0) : 0,
      employee ? prisma.leaveBalance.findMany({
        where: { employeeId: employee.id },
        select: { id: true, remainingDays: true, usedDays: true, leaveType: { select: { name: true, code: true } } }
      }).catch(() => []) : [],
      prisma.festivalHoliday.findMany({
        where: { calendar: { companyId: req.user.companyId }, date: { gte: new Date() } },
        take: 5,
        orderBy: { date: 'asc' },
        select: { id: true, name: true, date: true }
      }).catch(() => []),
      employee ? prisma.payrollItem.findMany({
        where: { employeeId: employee.id },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, netSalary: true, createdAt: true, payrollRun: { select: { month: true, year: true } } }
      }).catch(() => []) : []
    ]);

    const totalLeaveRemaining = leaveBalances.reduce((sum, b) => sum + Number(b.remainingDays || 0), 0);

    return successResponse(res, {
      isCheckedIn: Boolean(todayAttendance?.checkInAt && !todayAttendance?.checkOutAt),
      checkInTime: todayAttendance?.checkInAt || null,
      checkOutTime: todayAttendance?.checkOutAt || null,
      workMinutesToday: todayAttendance?.totalWorkedMinutes || 0,
      monthlyAttendanceCount,
      totalLeaveRemaining,
      leaveBalances,
      upcomingHolidays: holidays,
      recentPayslips: recentPayroll
    }, 'Employee dashboard summary retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/client', authenticate, requireCompany, cacheResponse('cache:client_dash', 60), async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const clientId = await getAuthClientId(req);

    const [projects, invoices] = await Promise.all([
      prisma.project.findMany({
        where: { companyId, ...(clientId ? { clientId } : {}) },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }).catch(() => []),
      prisma.invoice.findMany({
        where: { subscription: { companyId } },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }).catch(() => [])
    ]);

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total || inv.amount || 0), 0);

    return successResponse(res, {
      activeProjects: projects.length,
      projects,
      invoices,
      totalInvoiced
    }, 'Client dashboard retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/hr-manager-dashboard/metrics', authenticate, requireCompany, cacheResponse('cache:hr_mgr_metrics', 60), async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const emp = await getAuthEmployee(req);
    const departmentId = emp?.departmentId;
    const today = new Date(new Date().toISOString().split('T')[0]);

    const leaveWhere = { employee: { companyId }, status: 'PENDING' };
    if (departmentId) leaveWhere.employee = { departmentId };

    const [pendingLeaves, logs] = await Promise.all([
      prisma.leaveRequest.count({ where: leaveWhere }).catch(() => 0),
      prisma.attendanceLog.findMany({
        where: {
          companyId,
          attendanceDate: today,
          ...(departmentId ? { employee: { departmentId } } : {})
        },
        select: { status: true, isLate: true }
      }).catch(() => [])
    ]);

    const presentToday = logs.filter(l => ['PRESENT', 'LATE', 'HALF_DAY'].includes(l.status)).length;
    const lateCount = logs.filter(l => l.status === 'LATE' || l.isLate).length;

    return successResponse(res, { pendingLeaves, presentToday, lateCount }, 'HR Manager metrics retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/manager-dashboard/team-summary', authenticate, requireCompany, cacheResponse('cache:mgr_team_summary', 60), async (req, res, next) => {
  try {
    const emp = await getAuthEmployee(req);
    const teamIds = await getManagerTeamIds(emp?.id);

    const [teamSize, pendingApprovals] = await Promise.all([
      prisma.employee.count({ where: { id: { in: teamIds }, status: 'ACTIVE' } }).catch(() => 0),
      prisma.approvalRequest.count({ where: { status: 'PENDING' } }).catch(() => 0)
    ]);
    return successResponse(res, { teamSize, pendingApprovals }, 'Team summary retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/employee-dashboard/summary', authenticate, requireCompany, cacheResponse('cache:emp_dash_summary', 60), async (req, res, next) => {
  try {
    const employee = await getAuthEmployee(req);
    const today = new Date(new Date().toISOString().split('T')[0]);
    const attendance = employee ? await prisma.attendanceLog.findUnique({
      where: { employeeId_attendanceDate: { employeeId: employee.id, attendanceDate: today } },
      select: { status: true, checkInAt: true, checkOutAt: true }
    }).catch(() => null) : null;

    return successResponse(res, {
      attendanceStatus: attendance?.status || 'NOT_CHECKED_IN',
      checkInTime: attendance?.checkInAt || null,
      checkOutTime: attendance?.checkOutAt || null
    }, 'Employee dashboard summary retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/employee-dashboard/attendance', authenticate, requireCompany, cacheResponse('cache:emp_dash_att', 60), async (req, res, next) => {
  try {
    const employee = await getAuthEmployee(req);
    const count = employee ? await prisma.attendanceLog.count({
      where: { employeeId: employee.id, status: 'PRESENT' }
    }).catch(() => 0) : 0;
    return successResponse(res, { daysPresent: count, daysAbsent: 0 }, 'Attendance stats retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/employee-dashboard/leave', authenticate, requireCompany, cacheResponse('cache:emp_dash_leave', 60), async (req, res, next) => {
  try {
    const employee = await getAuthEmployee(req);
    const balances = employee ? await prisma.leaveBalance.findMany({
      where: { employeeId: employee.id },
      select: {
        id: true,
        remainingDays: true,
        usedDays: true,
        totalDays: true,
        leaveType: { select: { id: true, name: true, code: true } }
      }
    }).catch(() => []) : [];
    return successResponse(res, balances, 'Leave balance retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/employee-dashboard/tasks', authenticate, requireCompany, cacheResponse('cache:emp_dash_tasks', 60), async (req, res, next) => {
  try {
    const employee = await getAuthEmployee(req);
    const tasks = employee ? await prisma.task.findMany({
      where: { employeeId: employee.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, priority: true, dueDate: true }
    }).catch(() => []) : [];
    return successResponse(res, tasks, 'Employee tasks retrieved');
  } catch (err) {
    next(err);
  }
});

router.use('/projects', projectsRoutes);
router.use('/tasks', tasksRoutes);

router.get('/clients', authenticate, requireCompany, cacheResponse('cache:clients_list', 60), async (req, res, next) => {
  try {
    const role = req.user?.role || 'EMPLOYEE';
    const companyId = req.user.companyId;
    const where = { companyId };

    if (role === 'CLIENT') {
      const clientId = await getAuthClientId(req);
      if (clientId) where.id = clientId;
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        projects: {
          select: { id: true, name: true, status: true, budget: true }
        },
        _count: {
          select: { projects: true, requirements: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return successResponse(res, clients, 'Clients retrieved');
  } catch (err) {
    next(err);
  }
});

router.post('/clients', authenticate, requireCompany, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN'), async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { name, email, phone, companyName, address } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Client name is required' });
    }

    let userId = null;
    let temporaryPassword = null;

    if (email) {
      let clientRole = await prisma.role.findFirst({ where: { name: 'CLIENT' } });
      if (!clientRole) {
        clientRole = await prisma.role.create({
          data: {
            name: 'CLIENT',
            displayName: 'Client',
            isSystem: true
          }
        }).catch(() => null);
      }
      temporaryPassword = `Client@${crypto.randomBytes(4).toString('hex')}!`;
      const passwordHash = await hashPassword(temporaryPassword);

      let user = await prisma.user.findUnique({
        where: { email },
        include: { userRoles: true }
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            companyId,
            status: 'ACTIVE',
            ...(clientRole ? {
              userRoles: {
                create: {
                  roleId: clientRole.id
                }
              }
            } : {})
          }
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            companyId: user.companyId || companyId
          }
        });
        if (clientRole && !user.userRoles?.some(ur => ur.roleId === clientRole.id)) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: clientRole.id
            }
          }).catch(() => null);
        }
      }
      userId = user.id;
    }

    const client = await prisma.client.create({
      data: {
        companyId,
        userId,
        name,
        email: email || null,
        phone: phone || null,
        companyName: companyName || null,
        address: address || null,
        isActive: true
      }
    });

    if (email && temporaryPassword) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

      console.log('========== CLIENT CREDENTIALS ==========');
      console.log('Client:', name);
      console.log('Email:', email);
      console.log('Temporary Password:', temporaryPassword);
      console.log('Login URL:', loginUrl);
      console.log('========================================');

      Promise.resolve().then(() => {
        addCredentialsEmail({
          to: email,
          name,
          email,
          password: temporaryPassword,
          role: 'CLIENT',
          companyName: company?.name || 'Mindstocs EMS',
          loginUrl
        }).catch((err) => {
          console.error('[EMAIL] Failed to send client credentials email:', err.message);
        });
      });
    }

    return successResponse(res, client, 'Client created successfully', 201);
  } catch (err) {
    next(err);
  }
});

router.get('/tasks', authenticate, requireCompany, cacheResponse('cache:tasks_main', 300), async (req, res, next) => {
  try {
    const role = req.user?.role || 'EMPLOYEE';
    const companyId = req.user.companyId;
    const where = { companyId };

    if (role === 'EMPLOYEE') {
      const empId = await getAuthEmployeeId(req);
      where.employeeId = empId;
    } else if (role === 'MANAGER') {
      const emp = await getAuthEmployee(req);
      const teamIds = await getManagerTeamIds(emp?.id);
      where.employeeId = { in: teamIds };
    } else if (role === 'HR_MANAGER') {
      const emp = await getAuthEmployee(req);
      if (emp?.departmentId) where.employee = { departmentId: emp.departmentId };
    }

    const tasks = await prisma.task.findMany({ where });
    return successResponse(res, tasks, 'Tasks retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/performance/cycles', authenticate, requireCompany, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'), cacheResponse('cache:perf:cycles', 60), async (req, res, next) => {
  try {
    const cycles = await prisma.performanceCycle.findMany({
      where: { companyId: req.user.companyId },
      include: {
        _count: {
          select: { reviews: true, goals: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return successResponse(res, cycles, 'Performance cycles retrieved');
  } catch (err) {
    next(err);
  }
});

router.post('/performance/cycles', authenticate, requireCompany, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN'), async (req, res, next) => {
  try {
    const { name, startDate, endDate, status } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Cycle name is required' });
    const cycle = await prisma.performanceCycle.create({
      data: {
        companyId: req.user.companyId,
        name,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 90 * 86400000),
        status: status || 'ACTIVE'
      }
    });
    return successResponse(res, cycle, 'Performance cycle created', 201);
  } catch (err) {
    next(err);
  }
});

router.get('/performance/reviews', authenticate, requireCompany, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'), cacheResponse('cache:perf:reviews', 60), async (req, res, next) => {
  try {
    const role = req.user?.role || 'EMPLOYEE';
    const companyId = req.user.companyId;
    const where = { employee: { companyId } };

    if (role === 'EMPLOYEE') {
      const empId = await getAuthEmployeeId(req);
      where.employeeId = empId;
    } else if (role === 'MANAGER') {
      const emp = await getAuthEmployee(req);
      const teamIds = await getManagerTeamIds(emp?.id);
      where.employeeId = { in: teamIds };
    } else if (role === 'HR_MANAGER') {
      const emp = await getAuthEmployee(req);
      if (emp?.departmentId) where.employee.departmentId = emp.departmentId;
    }

    const reviews = await prisma.performanceReview.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
            designation: { select: { name: true } }
          }
        },
        cycle: {
          select: { id: true, name: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return successResponse(res, reviews, 'Performance reviews retrieved');
  } catch (err) {
    next(err);
  }
});

router.post('/performance/reviews', authenticate, requireCompany, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER'), async (req, res, next) => {
  try {
    const { cycleId, employeeId, rating, comments, status } = req.body;
    if (!cycleId || !employeeId) {
      return res.status(400).json({ success: false, message: 'Cycle ID and Employee ID are required' });
    }
    const review = await prisma.performanceReview.create({
      data: {
        cycleId,
        employeeId,
        reviewerId: req.user.id,
        rating: rating !== undefined && rating !== null ? Number(rating) : null,
        comments: comments || null,
        status: status || 'COMPLETED',
        submittedAt: new Date()
      },
      include: {
        employee: true,
        cycle: true
      }
    });
    return successResponse(res, review, 'Performance review submitted', 201);
  } catch (err) {
    next(err);
  }
});

router.get('/performance/team', authenticate, requireCompany, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER'), async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const role = req.user?.role || 'EMPLOYEE';
    const emp = await getAuthEmployee(req);

    let subordinateIds = [];
    if (role === 'MANAGER') {
      if (emp?.id) {
        const subs = await prisma.employee.findMany({
          where: { companyId, managerId: emp.id },
          select: { id: true }
        });
        subordinateIds = subs.map((s) => s.id);
      }
    } else if (role === 'HR_MANAGER') {
      if (emp?.departmentId) {
        const subs = await prisma.employee.findMany({
          where: { companyId, departmentId: emp.departmentId },
          select: { id: true }
        });
        subordinateIds = subs.map((s) => s.id);
      }
    } else {
      const subs = await prisma.employee.findMany({
        where: { companyId },
        select: { id: true }
      });
      subordinateIds = subs.map((s) => s.id);
    }

    const employees = await prisma.employee.findMany({
      where: { id: { in: subordinateIds }, companyId },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        performanceReviews: {
          include: { cycle: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        goals: {
          where: { status: 'ACTIVE' },
          take: 5
        }
      },
      orderBy: { firstName: 'asc' }
    });

    const reviews = await prisma.performanceReview.findMany({
      where: { employeeId: { in: subordinateIds } },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true }
        },
        cycle: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalMembers = employees.length;
    const completedReviews = reviews.filter((r) => r.status === 'COMPLETED').length;
    const pendingReviews = reviews.filter((r) => r.status !== 'COMPLETED').length;
    const ratings = reviews.filter((r) => r.rating !== null).map((r) => Number(r.rating));
    const avgRating = ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : 0;

    return successResponse(res, {
      team: employees,
      reviews,
      stats: {
        totalMembers,
        completedReviews,
        pendingReviews,
        avgRating
      }
    }, 'Team performance data retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/certificates/templates', authenticate, requireCompany, cacheResponse('cache:cert:templates', 300), async (req, res, next) => {
  try {
    const templates = await prisma.certificateTemplate.findMany({
      where: { companyId: req.user.companyId }
    });
    return successResponse(res, templates, 'Certificate templates retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/certificates', authenticate, requireCompany, cacheResponse('cache:cert:list', 300), async (req, res, next) => {
  try {
    const role = req.user?.role || 'EMPLOYEE';
    const companyId = req.user.companyId;
    const where = { companyId };

    if (role === 'EMPLOYEE') {
      const empId = await getAuthEmployeeId(req);
      where.employeeId = empId;
    } else if (role === 'MANAGER') {
      const emp = await getAuthEmployee(req);
      const teamIds = await getManagerTeamIds(emp?.id);
      where.employeeId = { in: teamIds };
    } else if (role === 'HR_MANAGER') {
      const emp = await getAuthEmployee(req);
      if (emp?.departmentId) where.employee = { departmentId: emp.departmentId };
    }

    const certificates = await prisma.employeeCertificate.findMany({
      where,
      include: { employee: true, template: true }
    });
    return successResponse(res, certificates, 'Certificates retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/certificates/:id/download', authenticate, cacheResponse('cache:cert_dl', 300), async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = req.user?.role || 'EMPLOYEE';
    let cert = await prisma.employeeCertificate.findFirst({
      where: { id },
      include: { employee: true, template: true }
    }).catch(() => null);

    if (cert) {
      if (role === 'EMPLOYEE') {
        const authEmpId = await getAuthEmployeeId(req);
        if (cert.employeeId !== authEmpId) {
          return res.status(403).json({ status: 'error', message: 'Access denied: You can only download your own certificates' });
        }
      }
    }

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
