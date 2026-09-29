import { prisma } from '../../../config/prisma.js';
import logger from '../../../config/logger.js';
import attendanceService from '../attendance.service.js';
import attendanceRepository from '../attendance.repository.js';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

/**
 * Check if a given date is a weekly off for an employee
 */
async function checkWeeklyOff(employeeId, companyId, date) {
  const targetDate = new Date(date);
  const currentDayName = DAY_NAMES[targetDate.getDay()];

  // 1. Check custom weekly off assignment for employee
  const empWeeklyOff = await prisma.weeklyOffAssignment.findFirst({
    where: {
      employeeId,
      effectiveFrom: { lte: targetDate },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: targetDate } }
      ]
    },
    include: { weeklyOffRule: true },
    orderBy: { effectiveFrom: 'desc' }
  });

  if (empWeeklyOff?.weeklyOffRule?.isActive) {
    const days = (empWeeklyOff.weeklyOffRule.days || []).map((d) => d.toUpperCase());
    if (days.includes(currentDayName)) {
      return { isWeeklyOff: true, ruleName: empWeeklyOff.weeklyOffRule.name };
    }
    return { isWeeklyOff: false };
  }

  // 2. Fallback to company default active weekly off rule
  if (companyId) {
    const companyWeeklyOff = await prisma.weeklyOffRule.findFirst({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    if (companyWeeklyOff) {
      const days = (companyWeeklyOff.days || []).map((d) => d.toUpperCase());
      if (days.includes(currentDayName)) {
        return { isWeeklyOff: true, ruleName: companyWeeklyOff.name };
      }
    }
  }

  return { isWeeklyOff: false };
}

/**
 * Check if employee is on approved leave on the given date
 */
async function checkApprovedLeave(employeeId, date) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const leave = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      status: 'APPROVED',
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay }
    },
    include: { leaveType: true }
  });

  if (leave) {
    return {
      isOnLeave: true,
      leaveType: leave.leaveType?.name || 'Leave',
      leaveId: leave.id
    };
  }

  return { isOnLeave: false };
}

/**
 * Calculate the shift end cutoff time for absent marking
 * Handles both regular same-day shifts and overnight (cross-midnight) shifts
 */
export function calculateShiftEndCutoff(targetDate, shift, bufferMinutes = 15) {
  const startTimeStr = shift.startTime || '09:00';
  const endTimeStr = shift.endTime || '18:00';

  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);

  const shiftStart = new Date(targetDate);
  shiftStart.setHours(startH, startM, 0, 0);

  const shiftEnd = new Date(targetDate);
  shiftEnd.setHours(endH, endM, 0, 0);

  // If night shift or end time is earlier than start time (crosses midnight)
  if (shift.isNightShift || endH < startH || (endH === startH && endM <= startM)) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  const absentCutoff = new Date(shiftEnd.getTime() + bufferMinutes * 60 * 1000);
  return {
    shiftStart,
    shiftEnd,
    absentCutoff,
    isOvernight: shiftEnd.getDate() !== shiftStart.getDate()
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

  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // 1. Holiday Check
  const holidayInfo = await attendanceService.checkHoliday(companyId, targetDate);
  if (holidayInfo.isHoliday) {
    logger.info({ companyId, holiday: holidayInfo.holiday?.name }, 'Skipping absent marking: Company is on official holiday today');
    return {
      companyId,
      marked: 0,
      skipped: 0,
      reason: `Company holiday: ${holidayInfo.holiday?.name}`,
      details: []
    };
  }

  // 2. Fetch all active employees for this company
  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeCode: true,
      branchId: true,
      departmentId: true
    }
  });

  let markedCount = 0;
  let skippedCount = 0;
  const details = [];

  for (const employee of employees) {
    const empId = employee.id;

    // A. Weekly Off Check
    const weeklyOff = await checkWeeklyOff(empId, companyId, targetDate);
    if (weeklyOff.isWeeklyOff) {
      skippedCount++;
      details.push({ employeeId: empId, employeeCode: employee.employeeCode, action: 'SKIPPED', reason: 'WEEKLY_OFF' });
      continue;
    }

    // B. Approved Leave Check
    const leave = await checkApprovedLeave(empId, targetDate);
    if (leave.isOnLeave) {
      skippedCount++;
      details.push({ employeeId: empId, employeeCode: employee.employeeCode, action: 'SKIPPED', reason: 'ON_APPROVED_LEAVE' });
      continue;
    }

    // C. Shift Assignment Check
    const shiftInfo = await attendanceService.checkShiftAssignment(empId, targetDate, companyId);
    if (!shiftInfo.hasShift || !shiftInfo.shift) {
      skippedCount++;
      details.push({ employeeId: empId, employeeCode: employee.employeeCode, action: 'SKIPPED', reason: 'NO_SHIFT_ASSIGNED' });
      continue;
    }

    const shift = shiftInfo.shift;

    // D. Shift End Time Cutoff Calculation (Mark absent only AFTER shift ends + buffer)
    const { shiftStart, shiftEnd, absentCutoff } = calculateShiftEndCutoff(targetDate, shift, 15);

    // If current time is before absent cutoff and not forced, shift is still in progress
    if (!force && now.getTime() < absentCutoff.getTime()) {
      skippedCount++;
      details.push({
        employeeId: empId,
        employeeCode: employee.employeeCode,
        action: 'SKIPPED',
        reason: 'SHIFT_IN_PROGRESS',
        shiftStart: shiftStart.toISOString(),
        shiftEnd: shiftEnd.toISOString(),
        absentCutoff: absentCutoff.toISOString()
      });
      continue;
    }

    // E. Attendance Log Check (Idempotency & Punch Check)
    const existingLog = await prisma.attendanceLog.findFirst({
      where: {
        employeeId: empId,
        attendanceDate: startOfDay
      }
    });

    if (existingLog) {
      if (existingLog.checkInAt || ['PRESENT', 'LATE', 'HALF_DAY'].includes(existingLog.status)) {
        skippedCount++;
        details.push({ employeeId: empId, employeeCode: employee.employeeCode, action: 'SKIPPED', reason: 'ALREADY_PRESENT_OR_LATE' });
        continue;
      }

      if (existingLog.status === 'ABSENT') {
        skippedCount++;
        details.push({ employeeId: empId, employeeCode: employee.employeeCode, action: 'SKIPPED', reason: 'ALREADY_MARKED_ABSENT' });
        continue;
      }

      if (['ON_LEAVE', 'HOLIDAY', 'WEEKLY_OFF'].includes(existingLog.status)) {
        skippedCount++;
        details.push({ employeeId: empId, employeeCode: employee.employeeCode, action: 'SKIPPED', reason: `STATUS_${existingLog.status}` });
        continue;
      }

      // If draft or un-punched row exists, update to ABSENT
      await prisma.attendanceLog.update({
        where: { id: existingLog.id },
        data: {
          status: 'ABSENT',
          shiftId: shift.id,
          shiftName: shift.name,
          shiftStartTime: shift.startTime,
          shiftEndTime: shift.endTime,
          shiftSource: shiftInfo.source || 'COMPANY_DEFAULT',
          expectedStart: shiftStart,
          expectedEnd: shiftEnd,
          isRosterOverride: Boolean(shiftInfo.source === 'ROSTER'),
          remarks: 'Automatically marked absent: No punch-in recorded after shift concluded',
          attendanceMethod: 'SYSTEM'
        }
      });

      markedCount++;
      details.push({ employeeId: empId, employeeCode: employee.employeeCode, action: 'MARKED_ABSENT', logId: existingLog.id });
      continue;
    }

    // F. Create New Attendance Log with status=ABSENT
    const createdLog = await prisma.attendanceLog.create({
      data: {
        companyId,
        employeeId: empId,
        attendanceDate: startOfDay,
        status: 'ABSENT',
        shiftId: shift.id,
        shiftName: shift.name,
        shiftStartTime: shift.startTime,
        shiftEndTime: shift.endTime,
        shiftSource: shiftInfo.source || 'COMPANY_DEFAULT',
        expectedStart: shiftStart,
        expectedEnd: shiftEnd,
        isRosterOverride: Boolean(shiftInfo.source === 'ROSTER'),
        remarks: 'Automatically marked absent: No punch-in recorded after shift concluded',
        attendanceMethod: 'SYSTEM',
        isLate: false,
        lateMinutes: 0
      }
    });

    markedCount++;
    details.push({ employeeId: empId, employeeCode: employee.employeeCode, action: 'MARKED_ABSENT', logId: createdLog.id });
  }

  logger.info(
    { companyId, marked: markedCount, skipped: skippedCount, total: employees.length },
    `Absent marking completed for company: ${markedCount} marked, ${skippedCount} skipped`
  );

  return {
    companyId,
    marked: markedCount,
    skipped: skippedCount,
    total: employees.length,
    details
  };
}

/**
 * Mark absentees across all active companies
 * 
 * @param {object} [options] - Optional configuration overrides
 * @returns {Promise<{totalCompanies: number, totalMarked: number, totalSkipped: number, results: Array}>}
 */
export async function markAbsenteesAllCompanies(options = {}) {
  logger.info('INFO: Auto absent marking job started across all active companies...');
  const companies = await prisma.company.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true }
  });

  let totalMarked = 0;
  let totalSkipped = 0;
  const results = [];

  for (const company of companies) {
    try {
      const res = await markAbsenteesForCompany(company.id, options);
      totalMarked += res.marked || 0;
      totalSkipped += res.skipped || 0;
      results.push(res);
    } catch (err) {
      logger.error({ companyId: company.id, err: err.message }, 'Failed absent marking for company');
      results.push({ companyId: company.id, error: err.message, marked: 0, skipped: 0 });
    }
  }

  logger.info(
    { totalCompanies: companies.length, totalMarked, totalSkipped },
    'INFO: Auto absent marking job completed successfully across all companies'
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
  markAbsenteesAllCompanies
};
