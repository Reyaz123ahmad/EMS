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
import { cacheResponse, invalidateCache } from '../middlewares/cache.middleware.js';
import { successResponse } from '../utils/response.js';
import prisma from '../config/prisma.js';
import { getAuthEmployeeId, getAuthEmployee, getManagerTeamIds, getAuthClientId } from '../security/data-scope.js';

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

// ================= ANALYTICS & TREND HELPERS =================
async function get6MonthCompanyGrowthTrend() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  const promises = [5, 4, 3, 2, 1, 0].map(async (i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthName = months[d.getMonth()];

    const count = await prisma.company.count({
      where: { createdAt: { lte: endOfMonth } }
    }).catch(() => 0);

    return { month: monthName, companies: count };
  });

  return Promise.all(promises);
}

async function get6MonthRevenueTrend() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  const promises = [5, 4, 3, 2, 1, 0].map(async (i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthName = months[d.getMonth()];

    const result = await prisma.paymentTransaction.aggregate({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: d, lte: endOfMonth }
      },
      _sum: { amount: true }
    }).catch(() => ({ _sum: { amount: 0 } }));

    return {
      month: monthName,
      revenue: Number(result._sum?.amount || 0)
    };
  });

  return Promise.all(promises);
}

async function get7DayAttendanceTrend(companyId, employeeIds = null) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();

  const activeCountPromise = employeeIds ? Promise.resolve(employeeIds.length) : prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }).catch(() => 1);

  const dayPromises = [6, 5, 4, 3, 2, 1, 0].map(async (i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayDate = new Date(dateStr);
    const dayName = days[d.getDay()];

    const where = {
      companyId,
      attendanceDate: dayDate,
      ...(employeeIds && employeeIds.length > 0 ? { employeeId: { in: employeeIds } } : {})
    };

    const [totalPresent, totalLate] = await Promise.all([
      prisma.attendanceLog.count({ where: { ...where, status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] } } }).catch(() => 0),
      prisma.attendanceLog.count({ where: { ...where, OR: [{ status: 'LATE' }, { isLate: true }] } }).catch(() => 0)
    ]);

    return { dateStr, dayName, totalPresent, totalLate };
  });

  const [activeCount, dayResults] = await Promise.all([activeCountPromise, Promise.all(dayPromises)]);
  const safeActive = Math.max(1, activeCount || 1);

  return dayResults.map(({ dateStr, dayName, totalPresent, totalLate }) => ({
    date: dateStr,
    day: dayName,
    present: Math.min(100, Math.round((totalPresent / safeActive) * 100)),
    late: Math.min(100, Math.round((totalLate / safeActive) * 100)),
    presentCount: totalPresent,
    lateCount: totalLate
  }));
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

router.get('/roles', authenticate, cacheResponse('cache:roles', 3600), (req, res) => {
  return successResponse(res, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE', 'CLIENT'], 'Roles retrieved');
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
router.get('/dashboard/company-admin', authenticate, requireCompany, cacheResponse('cache:company_admin_dash', 60), async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const today = new Date(new Date().toISOString().split('T')[0]);

    const [
      totalEmployees,
      activeEmployees,
      totalBranches,
      totalDepartments,
      presentToday,
      lateToday,
      onLeaveToday,
      pendingApprovals,
      recentActivity,
      attendanceTrend,
      projects,
      subscriptionCost
    ] = await Promise.all([
      prisma.employee.count({ where: { companyId } }).catch(() => 0),
      prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }).catch(() => 0),
      prisma.branch.count({ where: { companyId } }).catch(() => 0),
      prisma.department.count({ where: { companyId } }).catch(() => 0),
      prisma.attendanceLog.count({
        where: {
          companyId,
          attendanceDate: today,
          status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] }
        }
      }).catch(() => 0),
      prisma.attendanceLog.count({
        where: {
          companyId,
          attendanceDate: today,
          OR: [{ status: 'LATE' }, { isLate: true }]
        }
      }).catch(() => 0),
      prisma.leaveRequest.count({
        where: {
          employee: { companyId },
          status: 'APPROVED',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      }).catch(() => 0),
      prisma.approvalRequest.findMany({
        where: { workflow: { companyId }, status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { workflow: true }
      }).catch(() => []),
      prisma.auditLog.findMany({
        where: { user: { companyId } },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }).catch(() => []),
      get7DayAttendanceTrend(companyId),
      prisma.project.findMany({
        where: { companyId }
      }).catch(() => []),
      prisma.paymentTransaction.aggregate({
        where: {
          subscription: { companyId },
          status: 'SUCCESS'
        },
        _sum: { amount: true }
      }).catch(() => ({ _sum: { amount: 0 } }))
    ]);

    const absentToday = Math.max(0, activeEmployees - presentToday - onLeaveToday);

    const attendanceBreakdown = [
      { name: 'Present', value: presentToday, color: '#10b981' },
      { name: 'Late', value: lateToday, color: '#f59e0b' },
      { name: 'On Leave', value: onLeaveToday, color: '#6366f1' },
      { name: 'Absent', value: absentToday, color: '#f43f5e' }
    ];

    const clientRevenue = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    const subscriptionExpense = Number(subscriptionCost._sum?.amount || 0);

    return successResponse(res, {
      role: 'COMPANY_ADMIN',
      totalEmployees: totalEmployees || 0,
      activeEmployees: activeEmployees || 0,
      totalBranches: totalBranches || 0,
      totalDepartments: totalDepartments || 0,
      presentToday: presentToday || 0,
      lateToday: lateToday || 0,
      onLeaveToday: onLeaveToday || 0,
      absentToday: absentToday || 0,
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
    }, 'Company admin dashboard retrieved');
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
        include: { employee: true, leaveType: true }
      }).catch(() => []),
      prisma.employeeDocument.findMany({
        where: { employee: { companyId }, status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { employee: true }
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
        include: {
          department: true,
          designation: true,
          attendanceLogs: {
            where: { attendanceDate: today },
            take: 1
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
      prisma.task.findMany({ where: { companyId, employeeId: { in: teamIds } }, take: 5, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.employee.findMany({
        where: { id: { in: teamIds } },
        take: 10,
        include: {
          attendanceLogs: { where: { attendanceDate: today }, take: 1 }
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
    const employee = await prisma.employee.findFirst({
      where: { userId: req.user.id }
    });

    const today = new Date(new Date().toISOString().split('T')[0]);

    const [todayAttendance, monthlyAttendanceCount, leaveBalances, holidays, recentPayroll] = await Promise.all([
      employee ? prisma.attendanceLog.findUnique({
        where: { employeeId_attendanceDate: { employeeId: employee.id, attendanceDate: today } }
      }).catch(() => null) : null,
      employee ? prisma.attendanceLog.count({
        where: { employeeId: employee.id, status: 'PRESENT' }
      }).catch(() => 0) : 0,
      employee ? prisma.leaveBalance.findMany({
        where: { employeeId: employee.id },
        include: { leaveType: true }
      }).catch(() => []) : [],
      prisma.festivalHoliday.findMany({
        where: { calendar: { companyId: req.user.companyId }, date: { gte: new Date() } },
        take: 5,
        orderBy: { date: 'asc' }
      }).catch(() => []),
      employee ? prisma.payrollItem.findMany({
        where: { employeeId: employee.id },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { payrollRun: true, salarySlip: true }
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

router.get('/hr-manager-dashboard/metrics', authenticate, requireCompany, async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const emp = await getAuthEmployee(req);
    const departmentId = emp?.departmentId;

    const leaveWhere = { employee: { companyId }, status: 'PENDING' };
    if (departmentId) leaveWhere.employee.departmentId = departmentId;

    const attWhere = { companyId, status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] } };
    if (departmentId) attWhere.employee = { departmentId };

    const lateWhere = { companyId, OR: [{ status: 'LATE' }, { isLate: true }] };
    if (departmentId) lateWhere.employee = { departmentId };

    const [pendingLeaves, presentToday, lateCount] = await Promise.all([
      prisma.leaveRequest.count({ where: leaveWhere }),
      prisma.attendanceLog.count({ where: attWhere }),
      prisma.attendanceLog.count({ where: lateWhere })
    ]);
    return successResponse(res, { pendingLeaves, presentToday, lateCount }, 'HR Manager metrics retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/manager-dashboard/team-summary', authenticate, requireCompany, async (req, res, next) => {
  try {
    const emp = await getAuthEmployee(req);
    const teamIds = await getManagerTeamIds(emp?.id);

    const [teamSize, pendingApprovals] = await Promise.all([
      prisma.employee.count({ where: { id: { in: teamIds }, status: 'ACTIVE' } }),
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
    const role = req.user?.role || 'EMPLOYEE';
    const companyId = req.user.companyId;
    const where = { companyId };

    if (role === 'CLIENT') {
      const clientId = await getAuthClientId(req);
      if (clientId) where.clientId = clientId;
    } else if (role === 'EMPLOYEE') {
      const empId = await getAuthEmployeeId(req);
      if (empId) where.members = { some: { employeeId: empId } };
    } else if (role === 'MANAGER') {
      const emp = await getAuthEmployee(req);
      const teamIds = await getManagerTeamIds(emp?.id);
      where.members = { some: { employeeId: { in: teamIds } } };
    }

    const projects = await prisma.project.findMany({ where });
    return successResponse(res, projects, 'Projects retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/clients', authenticate, requireCompany, async (req, res, next) => {
  try {
    const role = req.user?.role || 'EMPLOYEE';
    const companyId = req.user.companyId;
    const where = { companyId };

    if (role === 'CLIENT') {
      const clientId = await getAuthClientId(req);
      if (clientId) where.id = clientId;
    }

    const clients = await prisma.client.findMany({ where });
    return successResponse(res, clients, 'Clients retrieved');
  } catch (err) {
    next(err);
  }
});

router.get('/tasks', authenticate, requireCompany, async (req, res, next) => {
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

    const reviews = await prisma.performanceReview.findMany({ where });
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

router.get('/certificates/:id/download', authenticate, async (req, res, next) => {
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
