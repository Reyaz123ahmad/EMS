import { prisma } from '../../../config/prisma.js';
import logger from '../../../config/logger.js';
import attendanceService from '../attendance.service.js';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

/**
 * Check if a given day is a weekly off based on rules/settings/default
 */
function isDayWeeklyOff(dayOfWeek, currentDayName, offDaysConfig) {
  if (!offDaysConfig || !Array.isArray(offDaysConfig) || offDaysConfig.length === 0) {
    // Default fallback: Sunday is weekly off (0 or SUNDAY)
    return dayOfWeek === 0 || currentDayName === 'SUNDAY';
  }
  return offDaysConfig.some((d) => {
    const dStr = String(d).toUpperCase().trim();
    return dStr === currentDayName || dStr === String(dayOfWeek) || Number(d) === dayOfWeek;
  });
}

/**
 * Calculate shift start and grace cutoff time
 */
export function calculateShiftGraceCutoff(targetDate, shift, defaultGrace = 15) {
  const startTimeStr = shift?.startTime || '09:00';
  const [startH, startM] = startTimeStr.split(':').map(Number);

  const shiftStart = new Date(targetDate);
  shiftStart.setHours(startH, startM || 0, 0, 0);

  const graceMinutes = Number(shift?.graceMinutes != null ? shift.graceMinutes : defaultGrace);
  const graceCutoff = new Date(shiftStart.getTime() + graceMinutes * 60000);

  return {
    shiftStart,
    graceCutoff,
    graceMinutes
  };
}

/**
 * Mark absentees for a single company
 * Scoped by companyId for multi-tenant isolation
 * 
 * @param {string} companyId - UUID of the company
 * @param {object} [options] - Optional overrides (date, currentTime, forceAllShifts)
 * @returns {Promise<{companyId: string, marked: number, skipped: number, total: number, details: Array}>}
 */
export async function markAbsenteesForCompany(companyId, options = {}) {
  const targetDate = options.date ? new Date(options.date) : new Date();
  const now = options.currentTime ? new Date(options.currentTime) : new Date();
  const force = Boolean(options.forceAllShifts);

  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ...
  const currentDayName = DAY_NAMES[dayOfWeek];

  const y = targetDate.getFullYear();
  const m = targetDate.getMonth();
  const d = targetDate.getDate();
  const startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));

  // 1. Company-wide Holiday Check
  const holidayInfo = await attendanceService.checkHoliday(companyId, targetDate).catch(() => ({ isHoliday: false, holiday: null }));
  if (holidayInfo?.isHoliday) {
    logger.info({ companyId, holiday: holidayInfo.holiday?.name, date: startOfDay.toISOString().slice(0, 10) }, 'Skipping absent marking: Company holiday today');
    return {
      companyId,
      date: startOfDay.toISOString().slice(0, 10),
      marked: 0,
      skipped: 'ALL',
      reason: 'HOLIDAY',
      holiday: holidayInfo.holiday?.name,
      details: []
    };
  }

  // 2. Fetch Company metadata & Weekly off rules
  const [
    company,
    weeklyOffRules,
    customWeeklyOffAssignments,
    employees,
    approvedLeaves,
    existingLogs,
    companyDefaultShift,
    allShiftAssignments,
    allRosters
  ] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, attendanceSettings: true, generalSettings: true }
    }),
    prisma.weeklyOffRule.findMany({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.weeklyOffAssignment.findMany({
      where: {
        employee: { companyId },
        effectiveFrom: { lte: targetDate },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: targetDate } }
        ]
      },
      include: { weeklyOffRule: true },
      orderBy: { effectiveFrom: 'desc' }
    }),
    prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, employeeCode: true, branchId: true, departmentId: true }
    }),
    prisma.leaveRequest.findMany({
      where: {
        employee: { companyId },
        status: 'APPROVED',
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay }
      },
      select: { employeeId: true }
    }),
    prisma.attendanceLog.findMany({
      where: {
        companyId,
        attendanceDate: startOfDay
      }
    }),
    prisma.shift.findFirst({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.shiftAssignment.findMany({
      where: {
        employee: { companyId },
        effectiveFrom: { lte: targetDate },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: targetDate } }
        ]
      },
      include: { shift: true },
      orderBy: { effectiveFrom: 'desc' }
    }),
    prisma.roster.findMany({
      where: {
        employee: { companyId },
        date: { gte: startOfDay, lte: endOfDay },
        isPublished: true
      },
      include: { shift: true }
    })
  ]);

  if (!employees || employees.length === 0) {
    return { companyId, marked: 0, skipped: 0, total: 0, details: [] };
  }

  // Determine Company-wide default weekly off days
  let companyOffDays = [];
  if (weeklyOffRules && weeklyOffRules.length > 0) {
    companyOffDays = weeklyOffRules.flatMap((r) => r.days || []);
  } else if (company?.attendanceSettings?.weeklyOff && Array.isArray(company.attendanceSettings.weeklyOff)) {
    companyOffDays = company.attendanceSettings.weeklyOff;
  } else {
    // Default fallback is Sunday
    companyOffDays = ['SUNDAY', 0, '0'];
  }

  const isCompanyWeeklyOffToday = isDayWeeklyOff(dayOfWeek, currentDayName, companyOffDays);

  // If company-wide weekly off today and no employee has custom weekly off assignments overriding it
  if (isCompanyWeeklyOffToday && customWeeklyOffAssignments.length === 0) {
    logger.info({ companyId, day: currentDayName, date: startOfDay.toISOString().slice(0, 10) }, 'Skipping absent marking: Company-wide weekly off today');
    return {
      companyId,
      date: startOfDay.toISOString().slice(0, 10),
      marked: 0,
      skipped: employees.length,
      reason: 'WEEKLY_OFF',
      details: employees.map((e) => ({
        employeeId: e.id,
        employeeCode: e.employeeCode,
        action: 'SKIPPED',
        reason: 'WEEKLY_OFF'
      }))
    };
  }

  const onLeaveEmpIds = new Set(approvedLeaves.map((l) => l.employeeId));
  const logsByEmpId = new Map(existingLogs.map((l) => [l.employeeId, l]));

  // Index custom weekly offs
  const customWeeklyOffByEmpId = new Map();
  customWeeklyOffAssignments.forEach((wa) => {
    if (!customWeeklyOffByEmpId.has(wa.employeeId)) {
      customWeeklyOffByEmpId.set(wa.employeeId, wa);
    }
  });

  // Index rosters
  const rosterByEmpId = new Map();
  allRosters.forEach((r) => {
    if (!rosterByEmpId.has(r.employeeId)) {
      rosterByEmpId.set(r.employeeId, r);
    }
  });

  // Index shift assignments
  const shiftAssignmentByEmpId = new Map();
  allShiftAssignments.forEach((sa) => {
    if (!shiftAssignmentByEmpId.has(sa.employeeId)) {
      shiftAssignmentByEmpId.set(sa.employeeId, sa);
    }
  });

  let markedCount = 0;
  let skippedCount = 0;
  const details = [];
  const recordsToCreate = [];
  const logsToUpdate = [];

  for (const employee of employees) {
    const empId = employee.id;

    // A. Weekly Off Check for individual employee
    const customOff = customWeeklyOffByEmpId.get(empId);
    let isEmployeeWeeklyOff = false;
    let weeklyOffRuleName = 'Default Sunday';

    if (customOff?.weeklyOffRule?.isActive) {
      isEmployeeWeeklyOff = isDayWeeklyOff(dayOfWeek, currentDayName, customOff.weeklyOffRule.days);
      weeklyOffRuleName = customOff.weeklyOffRule.name;
    } else {
      isEmployeeWeeklyOff = isCompanyWeeklyOffToday;
      weeklyOffRuleName = weeklyOffRules[0]?.name || 'Default Sunday';
    }

    if (isEmployeeWeeklyOff) {
      skippedCount++;
      details.push({
        employeeId: empId,
        employeeCode: employee.employeeCode,
        action: 'SKIPPED',
        reason: 'WEEKLY_OFF',
        rule: weeklyOffRuleName
      });
      continue;
    }

    // B. Approved Leave Check
    if (onLeaveEmpIds.has(empId)) {
      skippedCount++;
      details.push({
        employeeId: empId,
        employeeCode: employee.employeeCode,
        action: 'SKIPPED',
        reason: 'ON_APPROVED_LEAVE'
      });
      continue;
    }

    // C. Shift Info Resolution (Roster > Assignment > Default)
    let shift = null;
    let shiftSource = 'COMPANY_DEFAULT';
    let isRosterOverride = false;

    const roster = rosterByEmpId.get(empId);
    if (roster?.shift && roster.shift.isActive !== false) {
      shift = roster.shift;
      shiftSource = 'ROSTER';
      isRosterOverride = true;
    } else {
      const sa = shiftAssignmentByEmpId.get(empId);
      if (sa?.shift && sa.shift.isActive !== false) {
        shift = sa.shift;
        shiftSource = 'ASSIGNMENT';
      } else if (companyDefaultShift && companyDefaultShift.isActive !== false) {
        shift = companyDefaultShift;
        shiftSource = 'COMPANY_DEFAULT';
      }
    }

    if (!shift || !shift.startTime) {
      logger.warn({ employeeId: empId }, 'No active shift found for employee, skipping absent marking');
      skippedCount++;
      details.push({
        employeeId: empId,
        employeeCode: employee.employeeCode,
        action: 'SKIPPED',
        reason: 'NO_SHIFT_ASSIGNED'
      });
      continue;
    }

    // D. Shift Timing & Grace Cutoff Check
    const { graceCutoff } = calculateShiftGraceCutoff(targetDate, shift);

    // If grace cutoff has not passed yet, SKIP (Do NOT mark absent before grace cutoff)
    if (!force && now.getTime() < graceCutoff.getTime()) {
      skippedCount++;
      details.push({
        employeeId: empId,
        employeeCode: employee.employeeCode,
        action: 'SKIPPED',
        reason: 'GRACE_NOT_PASSED',
        shiftName: shift.name,
        shiftStartTime: shift.startTime,
        graceCutoff: graceCutoff.toISOString()
      });
      continue;
    }

    // E. Existing log check
    const existingLog = logsByEmpId.get(empId);
    if (existingLog) {
      if (existingLog.checkInAt || ['PRESENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKLY_OFF', 'ABSENT'].includes(existingLog.status)) {
        skippedCount++;
        details.push({
          employeeId: empId,
          employeeCode: employee.employeeCode,
          action: 'SKIPPED',
          reason: 'ALREADY_MARKED',
          status: existingLog.status
        });
        continue;
      }

      logsToUpdate.push(existingLog.id);
      markedCount++;
      details.push({
        employeeId: empId,
        employeeCode: employee.employeeCode,
        action: 'MARKED_ABSENT',
        updated: true,
        shiftName: shift.name
      });
    } else {
      recordsToCreate.push({
        companyId,
        employeeId: empId,
        attendanceDate: startOfDay,
        status: 'ABSENT',
        shiftId: shift.id,
        shiftName: shift.name,
        shiftStartTime: shift.startTime,
        shiftEndTime: shift.endTime,
        shiftSource,
        isRosterOverride,
        isLate: false,
        isHoliday: false,
        totalWorkedMinutes: 0,
        remarks: 'Marked by SYSTEM'
      });
      markedCount++;
      details.push({
        employeeId: empId,
        employeeCode: employee.employeeCode,
        action: 'MARKED_ABSENT',
        created: true,
        shiftName: shift.name
      });
    }

    if (global._todayAttendanceCache) {
      const cacheKey = `${empId}_${startOfDay.toISOString().split('T')[0]}`;
      global._todayAttendanceCache.delete(cacheKey);
    }
  }

  // Execute bulk updates / creates in batch
  if (recordsToCreate.length > 0) {
    await prisma.attendanceLog.createMany({
      data: recordsToCreate,
      skipDuplicates: true
    });
  }

  if (logsToUpdate.length > 0) {
    await prisma.attendanceLog.updateMany({
      where: { id: { in: logsToUpdate } },
      data: { status: 'ABSENT' }
    });
  }

  logger.info(
    { companyId, date: startOfDay.toISOString().split('T')[0], marked: markedCount, skipped: skippedCount, total: employees.length },
    `Absent marking completed for company: ${markedCount} marked, ${skippedCount} skipped`
  );

  return {
    companyId,
    date: startOfDay.toISOString().split('T')[0],
    marked: markedCount,
    skipped: skippedCount,
    total: employees.length,
    details
  };
}

/**
 * Mark absentees across all active companies
 * Evaluates both today and yesterday (to catch overnight/night shifts that concluded)
 * 
 * @param {object} [options] - Optional configuration overrides
 * @returns {Promise<{totalCompanies: number, totalMarked: number, totalSkipped: number, results: Array}>}
 */
export async function markAbsenteesAllCompanies(options = {}) {
  logger.info('Auto absent marking job started across all active companies...');
  const companies = await prisma.company.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true }
  });

  let totalMarked = 0;
  let totalSkipped = 0;
  const results = [];

  const datesToEvaluate = options.date ? [new Date(options.date)] : [
    new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    new Date()                                   // Today
  ];

  for (const company of companies) {
    for (const evalDate of datesToEvaluate) {
      try {
        const res = await markAbsenteesForCompany(company.id, {
          ...options,
          date: evalDate
        });
        totalMarked += res.marked || 0;
        totalSkipped += (typeof res.skipped === 'number' ? res.skipped : 0);
        results.push(res);
      } catch (err) {
        logger.error({ companyId: company.id, date: evalDate, err: err.message }, 'Failed absent marking for company');
        results.push({ companyId: company.id, error: err.message, marked: 0, skipped: 0 });
      }
    }
  }

  logger.info(
    { totalCompanies: companies.length, totalMarked, totalSkipped },
    'Auto absent marking job completed successfully across all companies'
  );

  return {
    totalCompanies: companies.length,
    totalMarked,
    totalSkipped,
    results
  };
}

export default {
  markAbsenteesForCompany,
  markAbsenteesAllCompanies,
  calculateShiftGraceCutoff
};
