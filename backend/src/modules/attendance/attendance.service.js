import { resolveShiftForEmployee, getEffectiveShiftOverview } from '../shifts/services/shift-resolver.service.js';
import attendanceRepository from './attendance.repository.js';
import { attendanceSecurityRepository } from '../attendance-security/attendance-security.repository.js';
import { biometricCardsService } from '../biometric-cards/biometric-cards.service.js';
import attendanceRules from './attendance.rules.js';
import {
  geoFencingService,
  faceMatchService,
  fraudDetectionService
} from '../attendance-security/attendance-security.service.js';
import { advancedSecurityService } from '../advanced-security/advanced-security.service.js';
import { prisma } from '../../config/prisma.js';
import * as faceService from '../../services/face.service.js';
import { decryptData } from '../../security/encryption.js';

export function getZonedDateParts(date = new Date(), timeZone = 'Asia/Kolkata') {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date instanceof Date ? date : new Date(date));
  const map = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour: parseInt(map.hour === '24' ? '00' : map.hour, 10),
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10)
  };
}

export function combineDateWithTime(date = new Date(), timeStr = '09:00', timeZone = 'Asia/Kolkata') {
  const parts = getZonedDateParts(date, timeZone);
  const [hoursStr, minutesStr] = (timeStr || '09:00').split(':');
  const h = parseInt(hoursStr, 10) || 0;
  const m = parseInt(minutesStr, 10) || 0;

  const isoLocal = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  const tempUtc = new Date(`${isoLocal}Z`);
  const utcParts = getZonedDateParts(tempUtc, timeZone);
  const offsetMs = tempUtc.getTime() - new Date(Date.UTC(utcParts.year, utcParts.month - 1, utcParts.day, utcParts.hour, utcParts.minute, utcParts.second)).getTime();
  return new Date(tempUtc.getTime() + offsetMs);
}

export function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * 60000);
}

export function getShiftWindow(date = new Date(), shift = null, timeZone = 'Asia/Kolkata') {
  const targetDate = new Date(date);
  const startTime = shift?.startTime || '09:00';
  const endTime = shift?.endTime || '18:00';
  const graceMinutes = Number(shift?.graceMinutes !== undefined && shift?.graceMinutes !== null ? shift.graceMinutes : 15);
  const isNightShift = Boolean(shift?.isNightShift || (endTime && startTime && endTime <= startTime));

  const shiftStart = combineDateWithTime(targetDate, startTime, timeZone);
  const shiftEnd = combineDateWithTime(targetDate, endTime, timeZone);

  if (isNightShift || shiftEnd <= shiftStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  const graceCutoff = addMinutes(shiftStart, graceMinutes);
  const totalShiftMinutes = Math.max(1, Math.round((shiftEnd.getTime() - shiftStart.getTime()) / 60000));
  const requiredHours = Number((totalShiftMinutes / 60).toFixed(2));

  return {
    shiftStart,
    shiftEnd,
    graceCutoff,
    graceMinutes,
    totalShiftMinutes,
    requiredHours,
    isNightShift
  };
}

export function getCheckInWindow({ shift, now = new Date(), date = new Date(), timeZone = 'Asia/Kolkata' }) {
  const window = getShiftWindow(date || now, shift, timeZone);
  const shiftStart = window.shiftStart;
  const shiftEnd = window.shiftEnd;
  const graceMinutes = window.graceMinutes;
  const fiveMinBefore = addMinutes(shiftStart, -5);
  const graceCutoff = window.graceCutoff;

  const nowObj = now instanceof Date ? now : new Date(now);
  const nowTime = nowObj.getTime();

  let windowStatus;
  let canCheckIn;
  let checkInBlockReason = null;

  const startTimeStr = shift?.startTime || '09:00';
  const endTimeStr = shift?.endTime || '18:00';
  const graceZoned = getZonedDateParts(graceCutoff, timeZone);
  const graceTimeStr = `${String(graceZoned.hour).padStart(2, '0')}:${String(graceZoned.minute).padStart(2, '0')}`;

  if (nowTime < fiveMinBefore.getTime()) {
    windowStatus = 'BEFORE_WINDOW';
    canCheckIn = false;
    const minsUntil = Math.max(0, Math.floor((shiftStart.getTime() - nowTime) / 60000));
    checkInBlockReason = `Your shift starts in ${minsUntil} minutes (at ${startTimeStr}). Cannot check in yet.`;
  } else if (nowTime <= graceCutoff.getTime()) {
    windowStatus = 'WINDOW_OPEN';
    canCheckIn = true;
    checkInBlockReason = null;
  } else if (nowTime <= shiftEnd.getTime()) {
    windowStatus = 'GRACE_PASSED';
    canCheckIn = false;
    checkInBlockReason = `Grace ended at ${graceTimeStr}. You will be marked ABSENT.`;
  } else {
    windowStatus = 'SHIFT_ENDED';
    canCheckIn = false;
    checkInBlockReason = `Your shift ended at ${endTimeStr}. Check-in not allowed.`;
  }

  const minutesUntilStart = nowObj < shiftStart
    ? Math.floor((shiftStart.getTime() - nowTime) / 60000)
    : 0;

  const minutesLeftInGrace = windowStatus === 'WINDOW_OPEN'
    ? Math.floor((graceCutoff.getTime() - nowTime) / 60000)
    : 0;

  return {
    shiftStart,
    shiftEnd,
    fiveMinBefore,
    graceCutoff,
    windowStatus,
    canCheckIn,
    checkInBlockReason,
    minutesUntilStart,
    minutesLeftInGrace
  };
}

export function computeExtraBreakMinutes({ shift, breaks = [] }) {
  const defaultRules = [
    { breakType: 'SHORT', allocatedMinutes: 30 },
    { breakType: 'LUNCH', allocatedMinutes: 30 }
  ];

  let rules = shift?.breakRules;
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    rules = defaultRules;
  }

  const usedByType = {};
  for (const b of (breaks || [])) {
    const type = String(b.breakType || 'SHORT').toUpperCase();
    const duration = Number(
      b.durationMinutes !== undefined && b.durationMinutes !== null
        ? b.durationMinutes
        : (b.totalBreakMinutes !== undefined && b.totalBreakMinutes !== null
            ? b.totalBreakMinutes
            : (b.breakStartAt && b.breakEndAt
                ? Math.round((new Date(b.breakEndAt).getTime() - new Date(b.breakStartAt).getTime()) / 60000)
                : 0))
    ) || 0;
    usedByType[type] = (usedByType[type] || 0) + duration;
  }

  const ruleMap = new Map();
  for (const r of rules) {
    const type = String(r.breakType || r.name || '').toUpperCase();
    if (type) {
      const allocated = Number(
        r.allocatedMinutes !== undefined && r.allocatedMinutes !== null
          ? r.allocatedMinutes
          : (r.durationMinutes !== undefined && r.durationMinutes !== null ? r.durationMinutes : 30)
      );
      ruleMap.set(type, allocated);
    }
  }

  for (const def of defaultRules) {
    if (!ruleMap.has(def.breakType)) {
      ruleMap.set(def.breakType, def.allocatedMinutes);
    }
  }

  let totalExtra = 0;
  for (const [type, allocated] of ruleMap.entries()) {
    const used = usedByType[type] || 0;
    totalExtra += Math.max(0, used - allocated);
  }

  for (const [usedType, used] of Object.entries(usedByType)) {
    if (!ruleMap.has(usedType)) {
      totalExtra += Math.max(0, used - 30);
    }
  }

  return totalExtra;
}

export function computeExpectedCheckout({ shift, lateMinutes = 0, breaks = [], attendanceDate = new Date(), checkInAt = null }) {
  const targetDate = checkInAt ? new Date(checkInAt) : new Date(attendanceDate);
  const window = getShiftWindow(targetDate, shift);
  const shiftEnd = window.shiftEnd;
  const late = Number(lateMinutes) || 0;
  const extraBreak = computeExtraBreakMinutes({ shift, breaks });
  const totalDelay = late + extraBreak;
  const expectedCheckout = new Date(shiftEnd.getTime() + totalDelay * 60000);
  return {
    expectedCheckout: expectedCheckout.toISOString(),
    expectedCheckoutDate: expectedCheckout,
    totalDelay,
    totalDelayMinutes: totalDelay,
    late,
    lateMinutes: late,
    extraBreak,
    extraBreakMinutes: extraBreak
  };
}

export const attendanceService = {
  /**
   * 1. Holiday Check (FestivalHoliday & HolidayCalendar)
   */
  async checkHoliday(companyId, date = new Date()) {
    if (!companyId) return { isHoliday: false, holiday: null };
    const targetDate = new Date(date);
    const targetDateStr = targetDate.toISOString().slice(0, 10);
    const year = targetDate.getFullYear();
    const cacheKey = `holidays:${companyId}:${year}`;
    if (!global._holidayCalendarCache) global._holidayCalendarCache = new Map();

    let calendar = null;
    const cached = global._holidayCalendarCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      calendar = cached.data;
    } else {
      calendar = await prisma.holidayCalendar.findFirst({
        where: {
          companyId,
          year,
          isActive: true
        },
        include: {
          holidays: true
        }
      });
      global._holidayCalendarCache.set(cacheKey, { data: calendar, expiresAt: Date.now() + 300000 });
    }

    if (!calendar || !calendar.holidays || calendar.holidays.length === 0) {
      return { isHoliday: false, holiday: null };
    }

    const matchedHoliday = calendar.holidays.find((h) => {
      const hDateStr = new Date(h.date).toISOString().slice(0, 10);
      return hDateStr === targetDateStr;
    });

    if (matchedHoliday) {
      return {
        isHoliday: true,
        holiday: {
          id: matchedHoliday.id,
          name: matchedHoliday.name,
          type: matchedHoliday.isMandatory ? 'MANDATORY' : 'OPTIONAL',
          isMandatory: Boolean(matchedHoliday.isMandatory),
          description: matchedHoliday.description
        }
      };
    }

    return { isHoliday: false, holiday: null };
  },

  /**
   * 2. Weekly Off Check
   */
  async checkWeeklyOff(companyId, employeeId, date = new Date(), settings = null) {
    if (!companyId) return { isWeeklyOff: false, dayName: null };
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[dayOfWeek];

    const rule = await prisma.weeklyOffRule.findFirst({
      where: {
        companyId,
        isActive: true
      }
    }).catch(() => null);

    let offDays = [0]; // default Sunday
    if (rule && Array.isArray(rule.days)) {
      offDays = rule.days;
    } else if (settings?.weeklyOff && Array.isArray(settings.weeklyOff)) {
      offDays = settings.weeklyOff;
    }

    const isWeeklyOff = offDays.includes(dayOfWeek) || offDays.includes(currentDayName.toUpperCase()) || offDays.includes(currentDayName);
    return {
      isWeeklyOff,
      dayName: isWeeklyOff ? currentDayName : null
    };
  },

  /**
   * 3. Approved Leave Check
   */
  async checkApprovedLeave(employeeId, date = new Date()) {
    if (!employeeId) return { isOnLeave: false, leave: null };
    const targetDate = new Date(date);
    const startOfDay = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999));

    const leave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay }
      },
      include: { leaveType: true }
    }).catch(() => null);

    if (leave) {
      return {
        isOnLeave: true,
        leave: {
          id: leave.id,
          leaveTypeName: leave.leaveType?.name || 'Approved Leave',
          reason: leave.reason
        }
      };
    }

    return { isOnLeave: false, leave: null };
  },

  /**
   * 4. Shift Assignment Check (Delegates to Canonical Shift Resolver)
   */
  async checkShiftAssignment(employeeId, date = new Date(), companyId = null) {
    return resolveShiftForEmployee({ employeeId, companyId, date });
  },

  /**
   * 3. Shift Timing Calculation (Late / On-time)
   */
  calculateLateMinutes(checkInTime = new Date(), shift, graceMinutes = 15) {
    const window = getShiftWindow(checkInTime, shift);
    const actualCheckIn = new Date(checkInTime);

    let lateMinutes = 0;
    if (actualCheckIn.getTime() > window.graceCutoff.getTime()) {
      lateMinutes = Math.max(0, Math.floor((actualCheckIn.getTime() - window.shiftStart.getTime()) / 60000));
    }

    return {
      isLate: lateMinutes > 0,
      lateMinutes,
      expectedCheckIn: shift?.startTime || '09:00',
      graceCutoff: window.graceCutoff
    };
  },

  /**
   * 4. Check Break Limit & Status
   */
  async checkBreakLimit(employeeId, companyId, preloadedLog = null, preloadedSettings = null) {
    const realCompanyId = companyId;
    const settings = preloadedSettings || await attendanceRules.getCompanyAttendanceSettings(realCompanyId);

    // Priority 1: ShiftBreakRule from Employee's Assigned Shift
    let applicableRules = [];
    let ruleSource = 'DEFAULTS';

    try {
      const shiftOverview = await resolveShiftForEmployee({ employeeId, companyId: realCompanyId, date: new Date() }).catch(() => null);
      if (shiftOverview?.shift?.breakRules && Array.isArray(shiftOverview.shift.breakRules) && shiftOverview.shift.breakRules.length > 0) {
        applicableRules = shiftOverview.shift.breakRules.filter((r) => r && r.isActive !== false);
        if (applicableRules.length > 0) {
          ruleSource = 'SHIFT';
        }
      }
    } catch {}

    // Priority 2: Company-wide BreakRule records (if no shift-specific rules)
    if (ruleSource === 'DEFAULTS' && realCompanyId) {
      try {
        const companyRules = await prisma.breakRule.findMany({
          where: { companyId: realCompanyId, isActive: true },
          orderBy: { createdAt: 'asc' }
        });
        if (companyRules && companyRules.length > 0) {
          applicableRules = companyRules;
          ruleSource = 'COMPANY';
        }
      } catch {}
    }

    // Determine limits
    let maxBreaks;
    let maxBreakMinutes;
    let lunchDuration;
    let shortDuration;
    let breakTypes;

    if (applicableRules.length > 0) {
      maxBreaks = applicableRules.reduce((sum, r) => sum + (Number(r.maxPerShift) || 1), 0);
      maxBreakMinutes = applicableRules.reduce((sum, r) => sum + ((Number(r.durationMinutes) || 0) * (Number(r.maxPerShift) || 1)), 0);

      const lunchRule = applicableRules.find((r) => r.name.toUpperCase().includes('LUNCH'));
      const shortRule = applicableRules.find((r) => !r.name.toUpperCase().includes('LUNCH'));

      lunchDuration = lunchRule ? Number(lunchRule.durationMinutes) : 0;
      shortDuration = shortRule ? Number(shortRule.durationMinutes) : 0;
      breakTypes = applicableRules.map((r) => r.name.toUpperCase());
    } else {
      // Priority 3: No break policy assigned (no shift rules, no company rules)
      ruleSource = 'NONE';
      maxBreaks = 0;
      maxBreakMinutes = 0;
      lunchDuration = 0;
      shortDuration = 0;
      breakTypes = [];
    }

    const todayLog = preloadedLog !== undefined && preloadedLog !== null
      ? preloadedLog
      : await attendanceRepository.findTodayAttendance(employeeId);
    const breaks = todayLog?.breaks || [];

    let totalBreakMinutes = 0;

    breaks.forEach((b) => {
      if (!b.breakEndAt) {
        const ongoingMins = Math.max(0, Math.round((Date.now() - new Date(b.breakStartAt).getTime()) / 60000));
        totalBreakMinutes += ongoingMins;
      } else if (b.totalBreakMinutes) {
        totalBreakMinutes += b.totalBreakMinutes;
      } else if (b.breakStartAt && b.breakEndAt) {
        const dur = Math.max(0, Math.round((new Date(b.breakEndAt).getTime() - new Date(b.breakStartAt).getTime()) / 60000));
        totalBreakMinutes += dur;
      }
    });

    const totalBreaks = breaks.length;
    const remainingBreaks = Math.max(0, maxBreaks - totalBreaks);
    const remainingMinutes = Math.max(0, maxBreakMinutes - totalBreakMinutes);

    const activeBreaks = breaks.filter((b) => !b.breakEndAt);
    const activeBreak = activeBreaks[0] || null;

    let canTakeBreak = true;
    let reason = 'You can take a break.';

    if (maxBreaks === 0 || maxBreakMinutes === 0) {
      canTakeBreak = false;
      reason = 'No break policy assigned to your shift.';
    } else if (totalBreaks >= maxBreaks) {
      canTakeBreak = false;
      reason = `Break limit reached. You have taken ${totalBreaks} of ${maxBreaks} breaks today.`;
    } else if (remainingMinutes <= 0) {
      canTakeBreak = false;
      reason = `Break time limit reached. You have used ${totalBreakMinutes} of ${maxBreakMinutes} allowed minutes today.`;
    }

    return {
      canTakeBreak,
      totalBreaks,
      remainingBreaks,
      totalBreakMinutes,
      remainingMinutes,
      maxBreaks,
      maxBreakMinutes,
      lunchDurationMinutes: lunchDuration,
      shortDurationMinutes: shortDuration,
      breakTypes,
      allowedBreakTypes: breakTypes,
      hasActiveBreak: activeBreaks.length > 0,
      activeBreak,
      activeBreaks,
      activeBreaksCount: activeBreaks.length,
      reason,
      ruleSource,
      rules: applicableRules
    };
  },

  /**
   * 5. Can Checkout Status & Validation
   */
  async canCheckout(employeeId, companyId, preloadedLog = null, preloadedSettings = null) {
    const realCompanyId = companyId;
    const settings = preloadedSettings || await attendanceRules.getCompanyAttendanceSettings(realCompanyId);
    const checkoutRules = settings.checkoutRules || {};

    const todayLog = preloadedLog !== undefined && preloadedLog !== null
      ? preloadedLog
      : await attendanceRepository.findTodayAttendance(employeeId);
    if (!todayLog || !todayLog.checkInAt) {
      return {
        canCheckout: false,
        remainingMinutes: 0,
        expectedCheckoutTime: null,
        expectedCheckout: null,
        totalDelayMinutes: 0,
        lateMinutes: 0,
        extraBreakMinutes: 0,
        actualMinutes: 0,
        requiredMinutes: 0,
        shortfallMinutes: 0,
        reason: 'You have not checked in today.'
      };
    }

    if (todayLog.checkOutAt) {
      return {
        canCheckout: false,
        remainingMinutes: 0,
        expectedCheckoutTime: todayLog.checkOutAt.toISOString(),
        expectedCheckout: todayLog.checkOutAt.toISOString(),
        totalDelayMinutes: 0,
        lateMinutes: todayLog.lateMinutes || 0,
        extraBreakMinutes: 0,
        actualMinutes: todayLog.totalWorkedMinutes || todayLog.workedMinutes || 0,
        requiredMinutes: todayLog.requiredMinutes || 0,
        shortfallMinutes: 0,
        reason: 'You have already checked out for today.'
      };
    }

    const now = new Date();
    const assignedShift = {
      startTime: todayLog.shiftStartTime || '09:00',
      endTime: todayLog.shiftEndTime || '18:00',
      graceMinutes: 15
    };
    const checkoutCalc = computeExpectedCheckout({
      shift: assignedShift,
      lateMinutes: todayLog.lateMinutes || 0,
      breaks: todayLog.breaks || [],
      attendanceDate: todayLog.attendanceDate,
      checkInAt: todayLog.checkInAt
    });

    const targetCheckout = checkoutCalc.expectedCheckoutDate;
    const canCheckout = now.getTime() >= targetCheckout.getTime();
    const remainingMinutes = canCheckout ? 0 : Math.ceil((targetCheckout.getTime() - now.getTime()) / 60000);
    const actualMinutes = attendanceRules.calculateWorkedMinutes(todayLog.checkInAt, now, todayLog.breaks);
    const requiredMinutes = todayLog.requiredMinutes || (todayLog.expectedEnd && todayLog.expectedStart ? Math.round((new Date(todayLog.expectedEnd).getTime() - new Date(todayLog.expectedStart).getTime()) / 60000) : 480);

    const formattedTargetTime = targetCheckout.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let reason = 'You can check out now.';
    if (!canCheckout) {
      reason = `You need to work ${remainingMinutes} more minutes. Checkout enabled at ${formattedTargetTime}.`;
    }

    return {
      canCheckout,
      remainingMinutes,
      expectedCheckoutTime: targetCheckout.toISOString(),
      expectedCheckout: targetCheckout.toISOString(),
      totalDelayMinutes: checkoutCalc.totalDelayMinutes,
      lateMinutes: checkoutCalc.lateMinutes,
      extraBreakMinutes: checkoutCalc.extraBreakMinutes,
      actualMinutes,
      requiredMinutes,
      shortfallMinutes: remainingMinutes,
      reason
    };
  },

  /**
   * 6. Multi-Layer Check-In (with Advanced Rules)
   */
  async checkIn({
    employeeId,
    companyId,
    mode = 'face',
    photo,
    location,
    deviceInfo = {},
    cardNumber,
    remarks,
    livenessScore = 0.95
  }) {
    // 1. Fetch all verification prerequisites concurrently in a single parallel batch
    const [todayLog, employee, settings, holidayInfo, shiftInfo, cardRecord] = await Promise.all([
      attendanceRepository.findTodayAttendance(employeeId),
      attendanceRepository.findEmployeeWithBranch(employeeId),
      attendanceRules.getCompanyAttendanceSettings(companyId),
      this.checkHoliday(companyId, new Date()),
      this.checkShiftAssignment(employeeId, new Date(), companyId),
      (mode.toLowerCase() === 'card' && cardNumber)
        ? attendanceRepository.findCardByNumber(companyId, cardNumber)
        : Promise.resolve(null)
    ]);

    if (todayLog && todayLog.checkInAt) {
      const err = new Error('You have already checked in for today.');
      err.statusCode = 400;
      throw err;
    }

    if (!employee) {
      throw new Error('Employee record not found.');
    }
    const empId = employee.id;

    // 3. Rule 1: Holiday Check
    if (holidayInfo.isHoliday && settings.holidayCheck?.blockAttendanceOnHoliday !== false) {
      if (settings.holidayCheck?.markHolidayAutomatically !== false) {
        if (!todayLog) {
          attendanceRepository.createAttendanceLog({
            companyId,
            employeeId: empId,
            attendanceDate: new Date(),
            status: 'HOLIDAY',
            isHoliday: true,
            holidayName: holidayInfo.holiday.name,
            holidayType: holidayInfo.holiday.type,
            remarks: `Official Holiday: ${holidayInfo.holiday.name}`
          }).catch(() => {});
        }
      }
      const err = new Error(`Today is a holiday: ${holidayInfo.holiday.name}. Attendance not required.`);
      err.statusCode = 400;
      throw err;
    }

    // 4. Rule 2: Shift Assignment Check
    if (!shiftInfo.hasShift && settings.shiftCheck?.blockAttendanceWithoutShift !== false) {
      const err = new Error('No shift assigned. Contact HR to assign a shift.');
      err.statusCode = 400;
      throw err;
    }
    const assignedShift = shiftInfo.shift;
    const now = new Date();
    const shiftWindow = getShiftWindow(now, assignedShift);
    const checkInWindow = getCheckInWindow({ shift: assignedShift, now, date: now });

    // BLOCK 1: Check-in before 5 minutes prior to shift.startTime
    if (now.getTime() < checkInWindow.fiveMinBefore.getTime()) {
      const err = new Error(`Your shift starts at ${assignedShift?.startTime || '09:00'}. Cannot check in yet.`);
      err.statusCode = 400;
      err.code = 'BEFORE_SHIFT_START';
      throw err;
    }

    // BLOCK 2: Check-in after shift.endTime
    if (now.getTime() > checkInWindow.shiftEnd.getTime()) {
      const err = new Error(`Your shift ended at ${assignedShift?.endTime || '18:00'}. Check-in not allowed.`);
      err.statusCode = 400;
      err.code = 'AFTER_SHIFT_END';
      throw err;
    }

    // BLOCK 3: Check-in after grace period expired
    if (now.getTime() > checkInWindow.graceCutoff.getTime()) {
      const graceStr = checkInWindow.graceCutoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const err = new Error(`Check-in time has passed. Grace period ended at ${graceStr}. You will be marked ABSENT.`);
      err.statusCode = 400;
      err.code = 'GRACE_PERIOD_EXPIRED';
      throw err;
    }

    // 5. Validate Mode Permission
    attendanceRules.validateModeEnabled(settings, mode);

    const verificationLayers = {
      liveness: false,
      faceMatch: false,
      geoFencing: false,
      deviceAttestation: false
    };

    // 7. Layer 1: Location & Geo-fencing Attestation
    if (location && location.lat !== undefined && location.lng !== undefined) {
      const geoResult = await geoFencingService.validateLocation({
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy,
        isMockLocation: deviceInfo.isMockLocation || false,
        ipAddress: deviceInfo.ipAddress,
        branch: employee.branch,
        companyId,
        employeeId: empId
      });

      if (!geoResult.passed && settings.geoFencing) {
        const err = new Error(`Location verification failed: ${geoResult.reason}`);
        err.statusCode = 403;
        throw err;
      }
      verificationLayers.geoFencing = geoResult.passed;
    }

    // 8. Layer 2: Device & Network Attestation
    if (deviceInfo.isMockLocation) {
      const err = new Error('Mock location detected on device.');
      err.statusCode = 403;
      throw err;
    }

    // IP Whitelist Check
    const ip = deviceInfo.ipAddress || location?.ip;
    if (ip) {
      const ipResult = await advancedSecurityService.validateIPAddress({ ipAddress: ip, companyId });
      if (!ipResult.passed) {
        const err = new Error(ipResult.reason);
        err.statusCode = 403;
        throw err;
      }

      // VPN Check
      const vpnResult = await advancedSecurityService.detectVPN({ ipAddress: ip });
      if (vpnResult.isVPN && settings.blockVpn) {
        const err = new Error('Virtual Private Network (VPN) detected. Direct connection required.');
        err.statusCode = 403;
        throw err;
      }
    }

    verificationLayers.deviceAttestation = true;

    // 9. Layer 3: Mode-Specific Biometric Verification
    let faceScore = null;
    let computedMethod = 'FACE';

    if (mode.toLowerCase() === 'face') {
      computedMethod = 'FACE';
      if (!photo) {
        const err = new Error('Live camera face photo is required for face check-in.');
        err.statusCode = 400;
        throw err;
      }

      const matchResult = await faceMatchService.matchFace(employee, photo);
      if (!matchResult.passed) {
        const err = new Error(`Face verification failed: Confidence score too low (${matchResult.matchConfidence}).`);
        err.statusCode = 403;
        throw err;
      }

      faceScore = matchResult.score;
      verificationLayers.faceMatch = true;
      verificationLayers.liveness = Number(livenessScore) >= 0.75;
    } else if (mode.toLowerCase() === 'card') {
      computedMethod = 'CARD';
      if (!cardNumber) {
        const err = new Error('NFC/RFID Card Number is required for card punch mode.');
        err.statusCode = 400;
        throw err;
      }

      const card = cardRecord || await attendanceRepository.findCardByNumber(companyId, cardNumber);
      if (!card || card.employeeId !== empId) {
        const err = new Error('Invalid or unassigned NFC/RFID access card.');
        err.statusCode = 400;
        throw err;
      }
      verificationLayers.faceMatch = true;
      verificationLayers.liveness = true;
    } else if (mode.toLowerCase() === 'finger') {
      computedMethod = 'FINGER';
      verificationLayers.faceMatch = true;
      verificationLayers.liveness = true;
    }

    // 10. Rule 3: Calculate Late Minutes from Shift Timing
    const lateCalc = this.calculateLateMinutes(now, assignedShift, shiftWindow.graceMinutes);
    const isLate = lateCalc.isLate;
    const lateMinutes = lateCalc.lateMinutes;
    const initialStatus = isLate ? 'LATE' : 'PRESENT';

    // 11. Rule 4: Expected Shift Start & End Timing Calculations
    const expectedStart = shiftWindow.shiftStart;
    const expectedEnd = shiftWindow.shiftEnd;
    const isRosterOverride = Boolean(shiftInfo.source === 'ROSTER');

    // Expected checkout = shift.endTime + lateMinutes
    const checkoutCalc = computeExpectedCheckout({
      shift: assignedShift,
      lateMinutes,
      breaks: [],
      attendanceDate: now,
      checkInAt: now
    });
    const adjustedCheckOutTime = checkoutCalc.expectedCheckoutDate;
    const requiredMinutes = shiftWindow.totalShiftMinutes;
    const maxBreaks = settings.breakRules?.maxBreaksPerDay || 3;
    const maxBreakMins = settings.breakRules?.maxBreakMinutesPerDay || 60;

    // 12. Construct Log and update in-memory cache immediately
    const logData = {
      id: crypto.randomUUID(),
      companyId,
      employeeId: empId,
      attendanceDate: new Date(),
      checkInAt: new Date(),
      checkInPhotoUrl: photo || null,
      attendanceMethod: computedMethod,
      faceMatchScore: faceScore,
      livenessScore: livenessScore,
      verificationLayers,
      checkInLatitude: location?.lat,
      checkInLongitude: location?.lng,
      checkInAccuracy: location?.accuracy,
      checkInDistance: location ? location.distance || 0 : null,
      checkInBranchId: employee.branchId,
      cardNumber,
      deviceId: deviceInfo.deviceId || null,
      isMockLocation: deviceInfo.isMockLocation || false,
      isVpnDetected: false,
      isDeviceTrusted: true,
      ipAddress: deviceInfo.ipAddress || null,
      isHoliday: false,
      holidayName: null,
      holidayType: null,
      shiftId: assignedShift?.id || null,
      shiftName: assignedShift?.name || null,
      shiftStartTime: assignedShift?.startTime || null,
      shiftEndTime: assignedShift?.endTime || null,
      shiftSource: shiftInfo.source || 'COMPANY_DEFAULT',
      expectedStart,
      expectedEnd,
      isRosterOverride,
      isLate,
      lateMinutes,
      adjustedCheckOutTime,
      requiredMinutes,
      totalBreaks: 0,
      totalBreakMinutes: 0,
      remainingBreaks: maxBreaks,
      remainingBreakMinutes: maxBreakMins,
      status: initialStatus,
      remarks,
      breaks: []
    };

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const cacheKey = `${empId}_${startOfDay.toISOString().split('T')[0]}`;
    if (!global._todayAttendanceCache) global._todayAttendanceCache = new Map();
    global._todayAttendanceCache.set(cacheKey, { data: logData, expiresAt: Date.now() + 60000 });

    // Asynchronous background persistence
    attendanceRepository.createAttendanceLog(logData).catch((err) => {
      console.error('[ATTENDANCE_PERSIST_ERROR]', err);
    });

    return {
      attendance: logData,
      verificationLayers,
      shift: assignedShift,
      isLate,
      lateMinutes,
      adjustedCheckOutTime: adjustedCheckOutTime.toISOString(),
      expectedCheckout: adjustedCheckOutTime.toISOString(),
      totalDelayMinutes: checkoutCalc.totalDelayMinutes,
      extraBreakMinutes: 0,
      message: `Check-in successful at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${initialStatus}).`
    };
  },

  /**
   * 7. Check-Out (with Working Hours & Extension Validation)
   */
  async checkOut({
    employeeId,
    companyId,
    mode = 'face',
    photo,
    location,
    deviceInfo = {},
    cardNumber,
    remarks
  }) {
    const [employee, todayLog, settings, holidayInfo] = await Promise.all([
      attendanceRepository.findEmployeeWithBranch(employeeId),
      attendanceRepository.findTodayAttendance(employeeId),
      attendanceRules.getCompanyAttendanceSettings(companyId),
      this.checkHoliday(companyId, new Date())
    ]);

    if (!employee) {
      throw new Error('Employee record not found.');
    }
    const empId = employee.id;

    if (!todayLog || !todayLog.checkInAt) {
      const err = new Error('You have not checked in today.');
      err.statusCode = 400;
      throw err;
    }

    if (todayLog.checkOutAt) {
      const err = new Error('You have already checked out for today.');
      err.statusCode = 400;
      throw err;
    }

    // Rule 1: Holiday Check
    if (holidayInfo.isHoliday && settings.holidayCheck?.blockAttendanceOnHoliday !== false) {
      const err = new Error(`Today is a holiday: ${holidayInfo.holiday.name}. Attendance operations are locked.`);
      err.statusCode = 400;
      throw err;
    }

    // Rule 5: Auto Checkout Extension & Working Hours Check
    const checkoutStatus = await this.canCheckout(empId, companyId, todayLog, settings);
    if (!checkoutStatus.canCheckout && settings.checkoutRules?.requireFullHours !== false) {
      const err = new Error(checkoutStatus.reason);
      err.statusCode = 400;
      throw err;
    }

    // Validate Device mock location
    if (deviceInfo.isMockLocation) {
      const err = new Error('Mock location detected on device.');
      err.statusCode = 403;
      throw err;
    }

    // Validate Geo-fencing on checkout if active
    if (location && location.lat !== undefined && location.lng !== undefined && settings.geoFencing) {
      const geoResult = await geoFencingService.validateLocation({
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy,
        isMockLocation: deviceInfo.isMockLocation || false,
        ipAddress: deviceInfo.ipAddress,
        branch: employee?.branch,
        companyId,
        employeeId: empId
      });

      if (!geoResult.passed) {
        const err = new Error(`Location verification failed on checkout: ${geoResult.reason}`);
        err.statusCode = 403;
        throw err;
      }
    }

    const checkOutTime = new Date();
    const actualMinutes = attendanceRules.calculateWorkedMinutes(
      todayLog.checkInAt,
      checkOutTime,
      todayLog.breaks
    );

    let earlyExitMinutes = 0;
    if (todayLog.expectedEnd) {
      const expEnd = new Date(todayLog.expectedEnd);
      if (checkOutTime < expEnd) {
        earlyExitMinutes = Math.max(0, Math.floor((expEnd.getTime() - checkOutTime.getTime()) / 60000));
      }
    }

    const requiredMinutes = todayLog.requiredMinutes || (settings.checkoutRules?.workingHours || 8) * 60;
    const overtimeMinutes = Math.max(0, actualMinutes - requiredMinutes);

    const finalStatus = attendanceRules.determineStatus(
      actualMinutes,
      settings,
      todayLog.isLate || (todayLog.lateMinutes > 0)
    );

    const updatedLog = await attendanceRepository.updateAttendanceLog(todayLog.id, {
      checkOutAt: checkOutTime,
      checkOutPhotoUrl: photo || null,
      checkOutLatitude: location?.lat,
      checkOutLongitude: location?.lng,
      checkOutAccuracy: location?.accuracy,
      totalWorkedMinutes: actualMinutes,
      workedMinutes: actualMinutes,
      actualMinutes,
      earlyExitMinutes,
      shortfallMinutes: Math.max(0, requiredMinutes - actualMinutes),
      overtimeMinutes,
      status: finalStatus,
      remarks: remarks ? `${todayLog.remarks ? todayLog.remarks + ' | ' : ''}${remarks}` : todayLog.remarks
    });

    return {
      attendance: updatedLog,
      totalHours: Math.round((actualMinutes / 60) * 10) / 10,
      actualMinutes,
      requiredMinutes,
      overtimeHours: Math.round((overtimeMinutes / 60) * 10) / 10,
      status: finalStatus,
      message: `Check-out successful at ${checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Total worked: ${Math.round((actualMinutes / 60) * 10) / 10} hrs.`
    };
  },

  /**
   * 8. Start Break (with Security, Limits, Types & Expected Return)
   */
  async startBreak({
    employeeId,
    companyId,
    breakType = 'SHORT',
    mode = 'face',
    photo,
    location,
    deviceInfo = {},
    cardNumber,
    remarks,
    livenessScore = 0.95
  }) {
    const [employee, todayLog, settings, holidayInfo] = await Promise.all([
      attendanceRepository.findEmployeeWithBranch(employeeId),
      attendanceRepository.findTodayAttendance(employeeId),
      attendanceRules.getCompanyAttendanceSettings(companyId),
      this.checkHoliday(companyId, new Date())
    ]);

    if (!employee) {
      throw new Error('Employee record not found.');
    }
    const empId = employee.id;

    if (!todayLog || !todayLog.checkInAt) {
      const err = new Error('You must check in before taking a break.');
      err.statusCode = 400;
      throw err;
    }

    if (todayLog.checkOutAt) {
      const err = new Error('Cannot start a break after checkout.');
      err.statusCode = 400;
      throw err;
    }

    // Rule 1: Holiday Check
    if (holidayInfo.isHoliday && settings.holidayCheck?.blockAttendanceOnHoliday !== false) {
      const err = new Error(`Today is a holiday: ${holidayInfo.holiday.name}. Break operations are disabled.`);
      err.statusCode = 400;
      throw err;
    }

    // Rule 2: Validate Mode Permission
    if (mode) {
      attendanceRules.validateModeEnabled(settings, mode);
    }

    // Rule 3: Break Limit & Type Validation
    const limitCheck = await this.checkBreakLimit(empId, companyId, todayLog, settings);
    if (!limitCheck.canTakeBreak) {
      const err = new Error(limitCheck.reason);
      err.statusCode = 400;
      throw err;
    }

    // Security Verification 1: Mock Location Detection
    if (deviceInfo.isMockLocation) {
      const err = new Error('Mock location detected on device.');
      err.statusCode = 403;
      throw err;
    }

    // Security Verification 2: Geo-Fencing Check
    if (location && location.lat !== undefined && location.lng !== undefined && settings.geoFencing) {
      const geoResult = await geoFencingService.validateLocation({
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy,
        isMockLocation: deviceInfo.isMockLocation || false,
        ipAddress: deviceInfo.ipAddress,
        branch: employee.branch,
        companyId,
        employeeId: empId
      });

      if (!geoResult.passed) {
        const err = new Error(`Location verification failed on break start: ${geoResult.reason}`);
        err.statusCode = 403;
        throw err;
      }
    }

    // Security Verification 3: Biometric / Mode Attestation
    let faceMatchResult = null;
    const effectiveLivenessScore = Number(livenessScore !== undefined ? livenessScore : 0.95);

    if (mode.toLowerCase() === 'face') {
      if (effectiveLivenessScore < 0.75) {
        const err = new Error('Liveness check failed. Please look directly into the camera and try again.');
        err.statusCode = 403;
        err.code = 'LIVENESS_FAILED';
        throw err;
      }

      if (!employee.faceEmbedding) {
        const err = new Error('No face registered. Please register your face first.');
        err.statusCode = 400;
        err.code = 'NO_FACE_REGISTERED';
        throw err;
      }

      if (!photo) {
        const err = new Error('Live camera face photo is required for face break start.');
        err.statusCode = 400;
        throw err;
      }

      faceMatchResult = await faceMatchService.matchFace(employee, photo);
      if (!faceMatchResult.passed) {
        const err = new Error(`Face mismatch (${faceMatchResult.matchConfidence || Math.round(faceMatchResult.score * 100) + '%'}).`);
        err.statusCode = 403;
        err.code = 'FACE_MISMATCH';
        throw err;
      }
    } else if (mode.toLowerCase() === 'card') {
      if (!cardNumber) {
        const err = new Error('NFC/RFID Card Number is required for card punch mode.');
        err.statusCode = 400;
        throw err;
      }

      const card = await attendanceRepository.findCardByNumber(companyId, cardNumber);
      if (!card || card.employeeId !== empId) {
        const err = new Error('Invalid or unassigned NFC/RFID access card.');
        err.statusCode = 400;
        throw err;
      }
    }

    const normType = (breakType || 'SHORT').toUpperCase();
    const allowedDuration = normType === 'LUNCH'
      ? limitCheck.lunchDurationMinutes
      : limitCheck.shortDurationMinutes;

    const expectedReturnTime = new Date(Date.now() + allowedDuration * 60000);

    const [newBreak] = await Promise.all([
      attendanceRepository.createAttendanceBreak({
        attendanceLogId: todayLog.id,
        employeeId: empId,
        breakStartAt: new Date(),
        breakType: normType,
        allowedDurationMinutes: allowedDuration,
        expectedReturnTime,
        breakPhotoUrl: photo || null,
        breakStartPhotoUrl: photo || null,
        breakLivenessScore: photo ? String(effectiveLivenessScore) : null,
        breakFaceMatchScore: faceMatchResult?.score ? String(faceMatchResult.score) : null
      }),
      attendanceRepository.updateAttendanceLog(todayLog.id, {
        totalBreaks: limitCheck.totalBreaks + 1,
        remainingBreaks: Math.max(0, limitCheck.remainingBreaks - 1)
      })
    ]);

    return {
      break: newBreak,
      breakType: normType,
      allowedDurationMinutes: allowedDuration,
      expectedReturnTime: expectedReturnTime.toISOString(),
      remainingBreaks: Math.max(0, limitCheck.remainingBreaks - 1),
      message: `${normType} break started at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Expected return: ${expectedReturnTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
    };
  },

  /**
   * 9. End Break (with Security, Late Return & Checkout Extension)
   */
  async endBreak({
    employeeId,
    companyId,
    breakId,
    mode = 'face',
    photo,
    location,
    deviceInfo = {},
    cardNumber,
    remarks,
    livenessScore = 0.95
  }) {
    const [employee, todayLog, settings] = await Promise.all([
      attendanceRepository.findEmployeeWithBranch(employeeId),
      attendanceRepository.findTodayAttendance(employeeId),
      attendanceRules.getCompanyAttendanceSettings(companyId)
    ]);

    if (!employee) {
      throw new Error('Employee record not found.');
    }
    const empId = employee.id;

    const activeBreaks = todayLog?.breaks?.filter((b) => !b.breakEndAt) || [];
    const activeBreak = breakId
      ? activeBreaks.find((b) => b.id === breakId)
      : activeBreaks[0] || null;
    if (!activeBreak) {
      const err = new Error(breakId ? 'Specified break is not active or not found.' : 'No active break found to end.');
      err.statusCode = 400;
      throw err;
    }

    // Security Verification 1: Mock Location Detection
    if (deviceInfo.isMockLocation) {
      const err = new Error('Mock location detected on device.');
      err.statusCode = 403;
      throw err;
    }

    // Security Verification 2: Geo-Fencing Check
    if (location && location.lat !== undefined && location.lng !== undefined && settings.geoFencing) {
      const geoResult = await geoFencingService.validateLocation({
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy,
        isMockLocation: deviceInfo.isMockLocation || false,
        ipAddress: deviceInfo.ipAddress,
        branch: employee?.branch,
        companyId,
        employeeId: empId
      });

      if (!geoResult.passed) {
        const err = new Error(`Location verification failed on break end: ${geoResult.reason}`);
        err.statusCode = 403;
        throw err;
      }
    }

    // Security Verification 3: Biometric / Mode Attestation
    let faceMatchResult = null;
    const effectiveLivenessScore = Number(livenessScore !== undefined ? livenessScore : 0.95);

    if (mode.toLowerCase() === 'face') {
      if (effectiveLivenessScore < 0.75) {
        const err = new Error('Liveness check failed. Please look directly into the camera and try again.');
        err.statusCode = 403;
        err.code = 'LIVENESS_FAILED';
        throw err;
      }

      if (!employee.faceEmbedding) {
        const err = new Error('No face registered. Please register your face first.');
        err.statusCode = 400;
        err.code = 'NO_FACE_REGISTERED';
        throw err;
      }

      if (!photo) {
        const err = new Error('Live camera face photo is required for face break end.');
        err.statusCode = 400;
        throw err;
      }

      faceMatchResult = await faceMatchService.matchFace(employee, photo);
      if (!faceMatchResult.passed) {
        const err = new Error(`Face mismatch (${faceMatchResult.matchConfidence || Math.round(faceMatchResult.score * 100) + '%'}).`);
        err.statusCode = 403;
        err.code = 'FACE_MISMATCH';
        throw err;
      }
    } else if (mode.toLowerCase() === 'card') {
      if (!cardNumber) {
        const err = new Error('NFC/RFID Card Number is required for card punch mode.');
        err.statusCode = 400;
        throw err;
      }

      const card = await attendanceRepository.findCardByNumber(companyId, cardNumber);
      if (!card || card.employeeId !== empId) {
        const err = new Error('Invalid or unassigned NFC/RFID access card.');
        err.statusCode = 400;
        throw err;
      }
    }

    const actualReturnTime = new Date();
    const startTime = new Date(activeBreak.breakStartAt);
    const durationMinutes = Math.max(1, Math.round((actualReturnTime.getTime() - startTime.getTime()) / 60000));

    // Rule 7 & 9: Break Return Time Check & Late Return Checkout Extension
    let lateReturnMinutes = 0;
    if (activeBreak.expectedReturnTime) {
      lateReturnMinutes = Math.max(0, Math.round((actualReturnTime.getTime() - new Date(activeBreak.expectedReturnTime).getTime()) / 60000));
    }

    const updatedBreak = await attendanceRepository.updateAttendanceBreak(activeBreak.id, {
      breakEndAt: actualReturnTime,
      breakEndPhotoUrl: photo || null,
      breakEndLivenessScore: photo ? String(effectiveLivenessScore) : null,
      breakEndFaceMatchScore: faceMatchResult?.score ? String(faceMatchResult.score) : null,
      actualReturnTime,
      lateReturnMinutes,
      totalBreakMinutes: durationMinutes
    });

    // Recompute Expected Checkout with ALL breaks for this attendance log
    const logId = todayLog ? todayLog.id : activeBreak.attendanceLogId;
    const allBreaks = await attendanceRepository.findTodayBreaks(logId);

    // Resolve Shift
    const shiftInfo = await this.checkShiftAssignment(empId, todayLog?.attendanceDate || new Date(), companyId);
    const assignedShift = shiftInfo?.shift || {
      startTime: todayLog?.shiftStartTime || '09:00',
      endTime: todayLog?.shiftEndTime || '18:00',
      graceMinutes: 15
    };

    const checkoutCalc = computeExpectedCheckout({
      shift: assignedShift,
      lateMinutes: todayLog?.lateMinutes || 0,
      breaks: allBreaks,
      attendanceDate: todayLog?.attendanceDate || new Date(),
      checkInAt: todayLog?.checkInAt || null
    });

    const totalBreakMinutes = allBreaks.reduce((acc, b) => acc + (b.totalBreakMinutes || 0), 0);
    const maxAllowed = settings.breakRules?.maxBreakMinutesPerDay || 60;

    if (todayLog) {
      await attendanceRepository.updateAttendanceLog(todayLog.id, {
        totalBreakMinutes,
        remainingBreakMinutes: Math.max(0, maxAllowed - totalBreakMinutes),
        adjustedCheckOutTime: checkoutCalc.expectedCheckoutDate
      });

      // Update in-memory cache if active
      const startOfDay = new Date(todayLog.attendanceDate || new Date());
      startOfDay.setUTCHours(0, 0, 0, 0);
      const cacheKey = `${empId}_${startOfDay.toISOString().split('T')[0]}`;
      if (global._todayAttendanceCache && global._todayAttendanceCache.has(cacheKey)) {
        const cached = global._todayAttendanceCache.get(cacheKey);
        if (cached && cached.data) {
          cached.data.totalBreakMinutes = totalBreakMinutes;
          cached.data.adjustedCheckOutTime = checkoutCalc.expectedCheckoutDate;
          cached.data.breaks = allBreaks;
        }
      }
    }

    let warningMessage = null;
    if (checkoutCalc.extraBreakMinutes > 0) {
      warningMessage = `Extra break of ${checkoutCalc.extraBreakMinutes} min detected. Expected checkout extended to ${checkoutCalc.expectedCheckoutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    }

    return {
      break: updatedBreak,
      durationMinutes,
      lateReturnMinutes,
      expectedCheckout: checkoutCalc.expectedCheckout,
      totalDelayMinutes: checkoutCalc.totalDelayMinutes,
      lateMinutes: checkoutCalc.lateMinutes,
      extraBreakMinutes: checkoutCalc.extraBreakMinutes,
      warning: warningMessage,
      message: warningMessage || `Break concluded. Total duration: ${durationMinutes} mins.`
    };
  },

  /**
   * 9b. End All Active Breaks (with Security & Checkout Extension)
   */
  async endAllBreaks({
    employeeId,
    companyId,
    mode = 'face',
    photo,
    location,
    deviceInfo = {},
    cardNumber,
    remarks,
    livenessScore = 0.95
  }) {
    const [employee, todayLog, settings] = await Promise.all([
      attendanceRepository.findEmployeeWithBranch(employeeId),
      attendanceRepository.findTodayAttendance(employeeId),
      attendanceRules.getCompanyAttendanceSettings(companyId)
    ]);

    if (!employee) {
      throw new Error('Employee record not found.');
    }
    const empId = employee.id;

    const activeBreaks = todayLog?.breaks?.filter((b) => !b.breakEndAt) || [];
    if (activeBreaks.length === 0) {
      const err = new Error('No active breaks found to end.');
      err.statusCode = 400;
      throw err;
    }

    // Security Verification 1: Mock Location Detection
    if (deviceInfo.isMockLocation) {
      const err = new Error('Mock location detected on device.');
      err.statusCode = 403;
      throw err;
    }

    // Security Verification 2: Geo-Fencing Check
    if (location && location.lat !== undefined && location.lng !== undefined && settings.geoFencing) {
      const geoResult = await geoFencingService.validateLocation({
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy,
        isMockLocation: deviceInfo.isMockLocation || false,
        ipAddress: deviceInfo.ipAddress,
        branch: employee?.branch,
        companyId,
        employeeId: empId
      });

      if (!geoResult.passed) {
        const err = new Error(`Location verification failed on break end: ${geoResult.reason}`);
        err.statusCode = 403;
        throw err;
      }
    }

    // Security Verification 3: Biometric / Mode Attestation
    let faceMatchResult = null;
    const effectiveLivenessScore = Number(livenessScore !== undefined ? livenessScore : 0.95);

    if (mode.toLowerCase() === 'face') {
      if (effectiveLivenessScore < 0.75) {
        const err = new Error('Liveness check failed. Please look directly into the camera and try again.');
        err.statusCode = 403;
        err.code = 'LIVENESS_FAILED';
        throw err;
      }

      if (!employee.faceEmbedding) {
        const err = new Error('No face registered. Please register your face first.');
        err.statusCode = 400;
        err.code = 'NO_FACE_REGISTERED';
        throw err;
      }

      if (!photo) {
        const err = new Error('Live camera face photo is required for face break end.');
        err.statusCode = 400;
        throw err;
      }

      faceMatchResult = await faceMatchService.matchFace(employee, photo);
      if (!faceMatchResult.passed) {
        const err = new Error(`Face mismatch (${faceMatchResult.matchConfidence || Math.round(faceMatchResult.score * 100) + '%'}).`);
        err.statusCode = 403;
        err.code = 'FACE_MISMATCH';
        throw err;
      }
    } else if (mode.toLowerCase() === 'card') {
      if (!cardNumber) {
        const err = new Error('NFC/RFID Card Number is required for card punch mode.');
        err.statusCode = 400;
        throw err;
      }

      const card = await attendanceRepository.findCardByNumber(companyId, cardNumber);
      if (!card || card.employeeId !== empId) {
        const err = new Error('Invalid or unassigned NFC/RFID access card.');
        err.statusCode = 400;
        throw err;
      }
    }

    const actualReturnTime = new Date();
    const updatedBreaks = [];

    for (const b of activeBreaks) {
      const startTime = new Date(b.breakStartAt);
      const durationMinutes = Math.max(1, Math.round((actualReturnTime.getTime() - startTime.getTime()) / 60000));
      let lateReturnMinutes = 0;
      if (b.expectedReturnTime) {
        lateReturnMinutes = Math.max(0, Math.round((actualReturnTime.getTime() - new Date(b.expectedReturnTime).getTime()) / 60000));
      }

      const updated = await attendanceRepository.updateAttendanceBreak(b.id, {
        breakEndAt: actualReturnTime,
        breakEndPhotoUrl: photo || null,
        breakEndLivenessScore: photo ? String(effectiveLivenessScore) : null,
        breakEndFaceMatchScore: faceMatchResult?.score ? String(faceMatchResult.score) : null,
        actualReturnTime,
        lateReturnMinutes,
        totalBreakMinutes: durationMinutes
      });
      updatedBreaks.push(updated);
    }

    const logId = todayLog ? todayLog.id : activeBreaks[0].attendanceLogId;
    const allBreaks = await attendanceRepository.findTodayBreaks(logId);

    const shiftInfo = await this.checkShiftAssignment(empId, todayLog?.attendanceDate || new Date(), companyId);
    const assignedShift = shiftInfo?.shift || {
      startTime: todayLog?.shiftStartTime || '09:00',
      endTime: todayLog?.shiftEndTime || '18:00',
      graceMinutes: 15
    };

    const checkoutCalc = computeExpectedCheckout({
      shift: assignedShift,
      lateMinutes: todayLog?.lateMinutes || 0,
      breaks: allBreaks,
      attendanceDate: todayLog?.attendanceDate || new Date(),
      checkInAt: todayLog?.checkInAt || null
    });

    const totalBreakMinutes = allBreaks.reduce((acc, b) => acc + (b.totalBreakMinutes || 0), 0);
    const maxAllowed = settings.breakRules?.maxBreakMinutesPerDay || 60;

    if (todayLog) {
      await attendanceRepository.updateAttendanceLog(todayLog.id, {
        totalBreakMinutes,
        remainingBreakMinutes: Math.max(0, maxAllowed - totalBreakMinutes),
        adjustedCheckOutTime: checkoutCalc.expectedCheckoutDate
      });

      const startOfDay = new Date(todayLog.attendanceDate || new Date());
      startOfDay.setUTCHours(0, 0, 0, 0);
      const cacheKey = `${empId}_${startOfDay.toISOString().split('T')[0]}`;
      if (global._todayAttendanceCache && global._todayAttendanceCache.has(cacheKey)) {
        const cached = global._todayAttendanceCache.get(cacheKey);
        if (cached && cached.data) {
          cached.data.totalBreakMinutes = totalBreakMinutes;
          cached.data.adjustedCheckOutTime = checkoutCalc.expectedCheckoutDate;
          cached.data.breaks = allBreaks;
        }
      }
    }

    let warningMessage = null;
    if (checkoutCalc.extraBreakMinutes > 0) {
      warningMessage = `Extra break of ${checkoutCalc.extraBreakMinutes} min detected. Expected checkout extended to ${checkoutCalc.expectedCheckoutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    }

    return {
      breaks: updatedBreaks,
      closedCount: updatedBreaks.length,
      expectedCheckout: checkoutCalc.expectedCheckout,
      totalDelayMinutes: checkoutCalc.totalDelayMinutes,
      lateMinutes: checkoutCalc.lateMinutes,
      extraBreakMinutes: checkoutCalc.extraBreakMinutes,
      warning: warningMessage,
      message: warningMessage || `All ${updatedBreaks.length} active breaks ended successfully.`
    };
  },

  /**
   * 10. Get Today's Status (Consolidated Holiday, Shift, Break & Checkout Info)
   */
  async getTodayStatus(employeeId, companyId) {
    const employee = await attendanceRepository.findEmployeeWithBranch(employeeId);
    const empId = employee ? employee.id : employeeId;
    const realCompanyId = companyId || employee?.companyId;

    const [attendance, holidayInfo, weeklyOffInfo, leaveInfo, shiftInfo, effectiveOverview, settings] = await Promise.all([
      attendanceRepository.findTodayAttendance(empId).catch(() => null),
      attendanceService.checkHoliday(realCompanyId, new Date()).catch(() => ({ isHoliday: false, holiday: null })),
      attendanceService.checkWeeklyOff(realCompanyId, empId, new Date()).catch(() => ({ isWeeklyOff: false, dayName: null })),
      attendanceService.checkApprovedLeave(empId, new Date()).catch(() => ({ isOnLeave: false, leave: null })),
      attendanceService.checkShiftAssignment(empId, new Date(), realCompanyId).catch(() => ({ shift: null, source: 'DEFAULT' })),
      getEffectiveShiftOverview({ employeeId: empId, companyId: realCompanyId, date: new Date() }).catch(() => ({ defaultShift: null })),
      attendanceRules.getCompanyAttendanceSettings(realCompanyId).catch(() => ({}))
    ]);

    const companyTimezone = settings?.timezone || 'Asia/Kolkata';
    const assignedShift = shiftInfo?.shift;
    const shiftWindow = getShiftWindow(new Date(), assignedShift, companyTimezone);
    const now = new Date();
    const checkInWindow = getCheckInWindow({ shift: assignedShift, now, date: now, timeZone: companyTimezone });

    const isCheckedIn = Boolean(attendance && attendance.checkInAt && !attendance.checkOutAt);
    const breaks = attendance?.breaks || [];
    const isOnBreak = Boolean(breaks.some((b) => !b.breakEndAt));

    const checkoutStatus = await attendanceService.canCheckout(empId, realCompanyId, attendance, settings).catch(() => ({ canCheckout: true, expectedCheckoutTime: null }));
    const breakStatus = await attendanceService.checkBreakLimit(empId, realCompanyId, attendance, settings).catch(() => ({ canTakeBreak: true }));

    // Determine strict 7-state metadata
    let attendanceState = 'BEFORE_WINDOW';
    let canCheckIn = false;
    let checkInBlockReason = null;
    let windowStatus = checkInWindow.windowStatus;
    let minutesUntilStart = 0;
    let minutesLeftInGrace = 0;

    // STATE 1: Public / Festival Holiday
    if (holidayInfo?.isHoliday) {
      attendanceState = 'HOLIDAY';
      windowStatus = 'HOLIDAY';
      canCheckIn = false;
      minutesUntilStart = 0;
      minutesLeftInGrace = 0;
      checkInBlockReason = `Today is a holiday: ${holidayInfo.holiday?.name || 'Public Holiday'}.`;
    }
    // STATE 2: Weekly Off
    else if (weeklyOffInfo?.isWeeklyOff) {
      attendanceState = 'WEEKLY_OFF';
      windowStatus = 'WEEKLY_OFF';
      canCheckIn = false;
      minutesUntilStart = 0;
      minutesLeftInGrace = 0;
      checkInBlockReason = 'Today is your weekly off.';
    }
    // STATE 3: Approved Leave
    else if (leaveInfo?.isOnLeave) {
      attendanceState = 'ON_LEAVE';
      windowStatus = 'ON_LEAVE';
      canCheckIn = false;
      minutesUntilStart = 0;
      minutesLeftInGrace = 0;
      checkInBlockReason = `You are on approved leave today${leaveInfo.leave?.leaveTypeName ? ` (${leaveInfo.leave.leaveTypeName})` : ''}.`;
    }
    // STATE 4 - 7: Normal shift flow
    else if (!attendance || !attendance.checkInAt) {
      if (!assignedShift) {
        attendanceState = 'NO_SHIFT';
        windowStatus = 'NO_SHIFT';
        canCheckIn = false;
        minutesUntilStart = 0;
        minutesLeftInGrace = 0;
        checkInBlockReason = 'No shift assigned to you. Please contact HR.';
      } else if (windowStatus === 'BEFORE_WINDOW') {
        attendanceState = 'BEFORE_WINDOW';
        canCheckIn = false;
        minutesUntilStart = checkInWindow.minutesUntilStart;
        minutesLeftInGrace = 0;
        checkInBlockReason = checkInWindow.checkInBlockReason;
      } else if (windowStatus === 'WINDOW_OPEN') {
        attendanceState = 'WINDOW_OPEN';
        canCheckIn = true;
        minutesUntilStart = 0;
        minutesLeftInGrace = checkInWindow.minutesLeftInGrace;
        checkInBlockReason = `Check-in window open. Grace ends in ${minutesLeftInGrace} minutes.`;
      } else if (windowStatus === 'GRACE_PASSED') {
        attendanceState = 'GRACE_PASSED';
        canCheckIn = false;
        minutesUntilStart = 0;
        minutesLeftInGrace = 0;
        checkInBlockReason = checkInWindow.checkInBlockReason;
      } else {
        attendanceState = 'SHIFT_ENDED';
        canCheckIn = false;
        minutesUntilStart = 0;
        minutesLeftInGrace = 0;
        checkInBlockReason = checkInWindow.checkInBlockReason;
      }
    } else {
      attendanceState = 'CHECKED_IN';
      canCheckIn = false;
      minutesUntilStart = 0;
      minutesLeftInGrace = 0;
      checkInBlockReason = 'Already checked in today.';
    }

    let expectedCheckout = null;
    let totalDelayMinutes = 0;
    let lateMinutes = 0;
    let extraBreakMinutes = 0;

    if (attendance && attendance.checkInAt) {
      const checkoutCalc = computeExpectedCheckout({
        shift: assignedShift,
        lateMinutes: attendance.lateMinutes || 0,
        breaks,
        attendanceDate: attendance.attendanceDate,
        checkInAt: attendance.checkInAt
      });
      expectedCheckout = checkoutCalc.expectedCheckout;
      totalDelayMinutes = checkoutCalc.totalDelayMinutes;
      lateMinutes = checkoutCalc.lateMinutes;
      extraBreakMinutes = checkoutCalc.extraBreakMinutes;
    } else {
      expectedCheckout = null;
      totalDelayMinutes = 0;
      lateMinutes = 0;
      extraBreakMinutes = 0;
    }

    const earliestCheckout = attendance?.expectedEnd
      ? new Date(attendance.expectedEnd).toISOString()
      : shiftWindow.shiftEnd.toISOString();

    const requiredHours = attendance?.requiredMinutes
      ? Number((attendance.requiredMinutes / 60).toFixed(2))
      : shiftWindow.requiredHours;

    return {
      attendance,
      breaks,
      isCheckedIn,
      isOnBreak,
      attendanceState,
      canCheckIn,
      checkInBlockReason,
      windowStatus,
      minutesUntilStart,
      minutesLeftInGrace,
      shiftStart: checkInWindow.shiftStart.toISOString(),
      shiftEnd: checkInWindow.shiftEnd.toISOString(),
      graceCutoff: checkInWindow.graceCutoff.toISOString(),
      fiveMinBefore: checkInWindow.fiveMinBefore.toISOString(),
      canCheckOut: checkoutStatus.canCheckout,
      date: new Date().toISOString().split('T')[0],
      timezone: companyTimezone,
      holiday: holidayInfo,
      weeklyOff: weeklyOffInfo,
      leave: leaveInfo,
      shift: shiftInfo,
      currentShift: assignedShift || null,
      shiftSource: shiftInfo?.source || 'DEFAULT',
      validTill: shiftInfo?.validTill || null,
      isRosterOverride: shiftInfo?.source === 'ROSTER',
      defaultShift: effectiveOverview?.defaultShift || null,
      defaultShiftStatus: shiftInfo?.source === 'ROSTER' ? 'DEACTIVATED_BY_ROSTER' : 'ACTIVE',
      expectedCheckout,
      earliestCheckout,
      requiredHours,
      totalDelayMinutes,
      lateMinutes,
      extraBreakMinutes,
      checkoutStatus,
      breakStatus
    };
  },

  /**
   * 11. List Attendance Logs
   */
  async listAttendanceLogs(companyId, filters, pagination) {
    return attendanceRepository.findAttendanceLogs(companyId, filters, pagination);
  },


  /**
   * 8. Attendance Daily / Department Stats
   */
  async getAttendanceStats(companyId, date) {
    return attendanceRepository.getAttendanceStats(companyId, date);
  },

  /**
   * 9. List Fraud Signals
   */
  async listFraudSignals(companyId, filters, pagination) {
    return attendanceSecurityRepository.findFraudSignals(companyId, filters, pagination);
  },

  /**
   * 10. Review Fraud Signal
   */
  async reviewFraudSignal(signalId, reviewedBy, notes, status = 'RESOLVED') {
    return fraudDetectionService.reviewSignal(signalId, reviewedBy, notes, status);
  },

  /**
   * 11. Card Scan Attendance (QR verification + multi-layer punch)
   */
  async cardScan({
    employeeId,
    companyId,
    qrData,
    operation = 'CHECK_IN',
    breakType = 'SHORT',
    location,
    deviceInfo = {},
    remarks
  }) {
    // 1. Verify QR data with HMAC signature & card lookup
    const verifyResult = await biometricCardsService.verifyAndMatchQR({ qrData, companyId });
    if (!verifyResult.valid) {
      await fraudDetectionService.logSecurityIncident({
        companyId,
        employeeId: employeeId || null,
        signalType: 'TAMPERED_REQUEST',
        severity: 'HIGH',
        description: `Invalid or tampered QR code attendance scan: ${verifyResult.reason}`,
        employeeLat: location?.lat,
        employeeLng: location?.lng,
        metadata: { qrData: typeof qrData === 'string' ? qrData.substring(0, 100) : null }
      });
      const err = new Error(verifyResult.reason || 'Invalid QR code');
      err.statusCode = 400;
      throw err;
    }

    const card = verifyResult.card;
    const targetEmployeeId = card.employeeId;
    const op = String(operation).toUpperCase().replace('-', '_');

    switch (op) {
      case 'CHECK_IN':
        return attendanceService.checkIn({
          employeeId: targetEmployeeId,
          companyId,
          mode: 'card',
          location,
          deviceInfo,
          cardNumber: card.cardNumber,
          remarks
        });
      case 'CHECK_OUT':
        return attendanceService.checkOut({
          employeeId: targetEmployeeId,
          companyId,
          mode: 'card',
          location,
          deviceInfo,
          cardNumber: card.cardNumber,
          remarks
        });
      case 'BREAK_START':
        return attendanceService.breakStart({
          employeeId: targetEmployeeId,
          companyId,
          mode: 'card',
          breakType,
          location,
          deviceInfo,
          remarks
        });
      case 'BREAK_END':
        return attendanceService.breakEnd({
          employeeId: targetEmployeeId,
          companyId,
          mode: 'card',
          location,
          deviceInfo,
          remarks
        });
      default: {
        const err = new Error(`Unsupported operation: ${operation}`);
        err.statusCode = 400;
        throw err;
      }
    }
  },

  /**
   * Calendar View: Day-wise attendance for month
   */
  async getAttendanceCalendar(companyId, month, year, filters = {}) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));

    const where = {
      companyId,
      attendanceDate: {
        gte: startDate,
        lte: endDate
      }
    };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.departmentId) where.employee = { departmentId: filters.departmentId };
    if (filters.branchId) {
      where.employee = { ...(where.employee || {}), branchId: filters.branchId };
    }

    const logs = await prisma.attendanceLog.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, departmentId: true, branchId: true }
        },
        breaks: true
      },
      orderBy: { attendanceDate: 'asc' }
    });

    const daysInMonth = new Date(y, m, 0).getDate();
    const calendarDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayLogs = logs.filter((l) => {
        const d = new Date(l.attendanceDate).toISOString().split('T')[0];
        return d === dateStr;
      });

      calendarDays.push({
        date: dateStr,
        day,
        totalLogs: dayLogs.length,
        summary: {
          present: dayLogs.filter((l) => l.status === 'PRESENT').length,
          late: dayLogs.filter((l) => l.status === 'LATE').length,
          halfDay: dayLogs.filter((l) => l.status === 'HALF_DAY').length,
          absent: dayLogs.filter((l) => l.status === 'ABSENT').length,
          onLeave: dayLogs.filter((l) => l.status === 'ON_LEAVE').length
        },
        logs: dayLogs
      });
    }

    return {
      month: m,
      year: y,
      totalLogs: logs.length,
      days: calendarDays
    };
  },

  /**
   * Monthly Summary for an Employee
   */
  async getEmployeeAttendanceSummary(employeeId, month, year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));

    const logs = await prisma.attendanceLog.findMany({
      where: {
        employeeId,
        attendanceDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { breaks: true },
      orderBy: { attendanceDate: 'asc' }
    });

    const presentDays = logs.filter((l) => l.status === 'PRESENT' || l.status === 'LATE').length;
    const lateDays = logs.filter((l) => l.status === 'LATE').length;
    const halfDays = logs.filter((l) => l.status === 'HALF_DAY').length;
    const absentDays = logs.filter((l) => l.status === 'ABSENT').length;
    const onLeaveDays = logs.filter((l) => l.status === 'ON_LEAVE').length;
    const totalWorkedMinutes = logs.reduce((acc, l) => acc + (l.totalWorkedMinutes || 0), 0);
    const totalOvertimeMinutes = logs.reduce((acc, l) => acc + (l.overtimeMinutes || 0), 0);

    return {
      employeeId,
      month: m,
      year: y,
      totalLogs: logs.length,
      presentDays,
      lateDays,
      halfDays,
      absentDays,
      onLeaveDays,
      totalWorkedMinutes,
      totalWorkedHours: parseFloat((totalWorkedMinutes / 60).toFixed(2)),
      totalOvertimeMinutes,
      totalOvertimeHours: parseFloat((totalOvertimeMinutes / 60).toFixed(2)),
      averageWorkingHours: logs.length > 0 ? parseFloat((totalWorkedMinutes / logs.length / 60).toFixed(2)) : 0,
      logs
    };
  },

  /**
   * Mark Manual Attendance (HR / Admin Override)
   */
  async markManualAttendance({ employeeId, date, checkIn, checkOut, status = 'PRESENT', reason, markedBy, companyId }) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    if (!employee) throw new Error('Employee not found');

    const effectiveCompanyId = companyId || employee.companyId;
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const dateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
    const parseDateTime = (timeVal) => {
      if (!timeVal) return null;
      if (timeVal instanceof Date) return isNaN(timeVal.getTime()) ? null : timeVal;
      if (typeof timeVal === 'string' && timeVal.includes('T')) {
        const d = new Date(timeVal);
        return isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(`${dateStr}T${timeVal}`);
      return isNaN(d.getTime()) ? null : d;
    };

    const checkInAt = parseDateTime(checkIn);
    const checkOutAt = parseDateTime(checkOut);
    let totalWorkedMinutes = null;

    if (checkInAt && checkOutAt) {
      totalWorkedMinutes = Math.max(0, Math.round((checkOutAt.getTime() - checkInAt.getTime()) / (1000 * 60)));
    }


    const log = await prisma.attendanceLog.upsert({
      where: {
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate
        }
      },
      update: {
        checkInAt,
        checkOutAt,
        status,
        totalWorkedMinutes,
        remarks: reason || 'Manual attendance recorded by administrator',
        attendanceMethod: 'MANUAL'
      },
      create: {
        companyId: effectiveCompanyId,
        employeeId,
        attendanceDate,
        checkInAt,
        checkOutAt,
        status,
        totalWorkedMinutes,
        remarks: reason || 'Manual attendance recorded by administrator',
        attendanceMethod: 'MANUAL'
      }
    });

    if (markedBy) {
      await prisma.auditLog.create({
        data: {
          userId: markedBy,
          action: 'MARK_MANUAL_ATTENDANCE',
          entity: 'AttendanceLog',
          entityId: log.id,
          newValues: { employeeId, date, status, checkIn, checkOut, reason }
        }
      }).catch(() => {});
    }

    return log;
  },

  /**
   * Bulk Mark Attendance
   */
  async bulkMarkAttendance({ employeeIds = [], date, status = 'PRESENT', markedBy, companyId, reason }) {
    const results = [];
    for (const empId of employeeIds) {
      try {
        const log = await this.markManualAttendance({
          employeeId: empId,
          date,
          status,
          reason: reason || 'Bulk attendance marked by administrator',
          markedBy,
          companyId
        });
        results.push({ employeeId: empId, status: 'SUCCESS', logId: log.id });
      } catch (err) {
        results.push({ employeeId: empId, status: 'FAILED', error: err.message });
      }
    }
    return {
      total: employeeIds.length,
      successCount: results.filter((r) => r.status === 'SUCCESS').length,
      failedCount: results.filter((r) => r.status === 'FAILED').length,
      results
    };
  },

  /**
   * Attendance Exceptions (Late, Absent, Missing checkout)
   */
  async getAttendanceExceptions(companyId, dateRange = {}) {
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();

    const exceptions = await prisma.attendanceLog.findMany({
      where: {
        companyId,
        attendanceDate: { gte: startDate, lte: endDate },
        OR: [
          { status: 'LATE' },
          { status: 'ABSENT' },
          { status: 'HALF_DAY' },
          { checkInAt: { not: null }, checkOutAt: null }
        ]
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true, department: true }
        }
      },
      orderBy: { attendanceDate: 'desc' }
    });

    return {
      total: exceptions.length,
      dateRange: { startDate, endDate },
      exceptions
    };
  },

  /**
   * Update Attendance Policy (Working hours, grace, half-day)
   */
  async updateAttendancePolicy(companyId, policy = {}) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error('Company not found');

    const currentSettings = company.attendanceSettings || {};
    const updatedAttendanceSettings = {
      ...(typeof currentSettings === 'object' ? currentSettings : {}),
      ...policy
    };

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        attendanceSettings: updatedAttendanceSettings
      }
    });

    return {
      companyId,
      policy: updatedCompany.attendanceSettings
    };
  },

  /**
   * Monthly Summary Analytics
   */
  async getMonthlySummary(paramsOrCompanyId, month, year, filters = {}) {
    let companyId, employeeId, targetMonth, targetYear, role, departmentId;

    if (typeof paramsOrCompanyId === 'object' && paramsOrCompanyId !== null) {
      companyId = paramsOrCompanyId.companyId;
      employeeId = paramsOrCompanyId.employeeId;
      targetMonth = paramsOrCompanyId.month;
      targetYear = paramsOrCompanyId.year;
      role = paramsOrCompanyId.role;
      departmentId = paramsOrCompanyId.departmentId;
    } else {
      companyId = paramsOrCompanyId;
      targetMonth = month;
      targetYear = year;
      employeeId = filters.employeeId;
      departmentId = filters.departmentId;
    }

    const parsedMonth = parseInt(targetMonth) || (new Date().getMonth() + 1);
    const parsedYear = parseInt(targetYear) || new Date().getFullYear();

    const startDate = new Date(parsedYear, parsedMonth - 1, 1);
    const endDate = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);

    const where = {
      companyId,
      attendanceDate: {
        gte: startDate,
        lte: endDate
      }
    };

    if (departmentId) {
      where.employee = { departmentId };
    }

    // Role-based filter
    if (employeeId && employeeId !== '__NO_ACCESS__') {
      where.employeeId = employeeId;
    }

    const logs = await prisma.attendanceLog.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: true
          }
        }
      },
      orderBy: { attendanceDate: 'asc' }
    });

    // Calculate stats
    const stats = {
      totalEmployees: new Set(logs.map((l) => l.employeeId)).size,
      totalPresent: logs.filter((l) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(l.status) || l.checkInAt || l.checkInTime).length,
      presentDays: logs.filter((l) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(l.status) || l.checkInAt || l.checkInTime).length,
      absentDays: logs.filter((l) => l.status === 'ABSENT').length,
      totalAbsent: logs.filter((l) => l.status === 'ABSENT').length,
      lateDays: logs.filter((l) => l.status === 'LATE' || l.isLate).length,
      totalLate: logs.filter((l) => l.status === 'LATE' || l.isLate).length,
      halfDays: logs.filter((l) => l.status === 'HALF_DAY').length,
      totalHalfDay: logs.filter((l) => l.status === 'HALF_DAY').length,
      onLeaveDays: logs.filter((l) => l.status === 'ON_LEAVE').length,
      totalWorkedMinutes: logs.reduce((sum, l) => sum + (l.totalWorkedMinutes || 0), 0),
      totalOvertimeMinutes: logs.reduce((sum, l) => sum + (l.overtimeMinutes || 0), 0),
      totalLateMinutes: logs.reduce((sum, l) => sum + (l.lateMinutes || 0), 0)
    };

    const totalWorkingDays = new Date(parsedYear, parsedMonth, 0).getDate();
    const punctualityRate = stats.presentDays > 0 ? Math.round(((stats.presentDays - stats.lateDays) / stats.presentDays) * 100) : 100;

    return {
      logs,
      stats,
      month: parsedMonth,
      year: parsedYear,
      presentDays: stats.presentDays,
      absentDays: stats.absentDays,
      halfDays: stats.halfDays,
      lateDays: stats.lateDays,
      totalWorkingDays,
      totalHours: Math.round((stats.totalWorkedMinutes / 60) * 10) / 10,
      overtimeHours: Math.round((stats.totalOvertimeMinutes / 60) * 10) / 10,
      totalOvertimeHours: Math.round((stats.totalOvertimeMinutes / 60) * 10) / 10,
      punctualityRate: isNaN(punctualityRate) ? 100 : punctualityRate,
      totalLogs: logs.length,
      employeeSummaries: []
    };
  },

  /**
   * Overtime Tracker
   */
  async getOvertimeTracker({ companyId, employeeId, role }) {
    const where = {
      ...(companyId ? { employee: { companyId } } : {})
    };
    if (role === 'EMPLOYEE' && employeeId) where.employeeId = employeeId;

    const [records, stats] = await Promise.all([
      prisma.overtimeRecord.findMany({
        where,
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true }
          }
        },
        orderBy: { date: 'desc' },
        take: 50
      }).catch(() => []),
      prisma.attendanceLog.aggregate({
        where: {
          companyId,
          ...(employeeId ? { employeeId } : {}),
          overtimeMinutes: { gt: 0 }
        },
        _sum: { overtimeMinutes: true },
        _count: { id: true }
      }).catch(() => ({ _sum: { overtimeMinutes: 0 }, _count: { id: 0 } }))
    ]);

    return {
      records,
      totalOvertimeMinutes: stats._sum?.overtimeMinutes || 0,
      totalOvertimeHours: Math.round(((stats._sum?.overtimeMinutes || 0) / 60) * 10) / 10,
      overtimeCount: stats._count?.id || 0
    };
  },

  /**
   * Shift Roster
   */
  async getShiftRoster({ companyId, employeeId, role }) {
    const [shifts, rosters] = await Promise.all([
      prisma.shift.findMany({
        where: { companyId, isActive: true }
      }).catch(() => []),
      prisma.shiftAssignment.findMany({
        where: {
          employee: { companyId },
          ...(role === 'EMPLOYEE' && employeeId ? { employeeId } : {})
        },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true }
          },
          shift: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }).catch(() => [])
    ]);

    return {
      shifts,
      rosters,
      totalShifts: shifts.length,
      totalRosters: rosters.length
    };
  },

  /**
   * QR Scanner Status
   */
  async getQrScanner({ companyId, employeeId }) {
    const cards = await prisma.employeeCard.findMany({
      where: {
        companyId,
        ...(employeeId ? { employeeId } : {})
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true }
        }
      },
      take: 20
    }).catch(() => []);

    return {
      status: 'active',
      scannerMode: 'DYNAMIC_QR',
      activeCardsCount: cards.length,
      recentCards: cards
    };
  },

  /**
   * Live Location Tracking
   */
  async getLiveLocation({ companyId }) {
    const branches = await prisma.branch.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        geofenceRadius: true,
        address: true,
        city: true,
        state: true
      }
    }).catch(() => []);

    return {
      branches: branches.map((b) => ({
        ...b,
        radius: b.geofenceRadius || 200
      })),
      activeTracking: true,
      timestamp: new Date().toISOString()
    };
  },



  /**
   * Match live face photo with employee enrolled face embedding (STRICT match)
   */
  async matchFace(employeeId, photoBase64) {
    console.log('=== FACE MATCH ===');

    // 1. Get employee's registered embedding
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, faceEmbedding: true, faceRegisteredAt: true }
    });

    console.log('Employee has embedding:', !!employee?.faceEmbedding);

    if (!employee?.faceEmbedding) {
      const error = new Error('No face registered. Register your face first.');
      error.statusCode = 400;
      error.code = 'NO_FACE_REGISTERED';
      throw error;
    }

    // 2. Anti-replay verification (reject duplicate photos within 24 hours)
    const replayCheck = await faceService.checkAndRecordImageReplay(photoBase64, employeeId, 86400);
    if (!replayCheck.passed) {
      const error = new Error('Replay attack detected. The submitted photo was already used previously.');
      error.statusCode = 400;
      error.code = 'REPLAY_DETECTED';
      throw error;
    }

    // 3. Generate embedding from LIVE photo (multi-face rejection enforced)
    const liveEmbedding = await faceService.generateEmbedding(photoBase64);

    console.log('Live embedding generated:', !!liveEmbedding);

    if (!liveEmbedding || liveEmbedding.length === 0) {
      const error = new Error('No face detected in live photo');
      error.statusCode = 400;
      error.code = 'NO_FACE_DETECTED';
      throw error;
    }

    // 4. Decrypt stored embedding
    let storedEmbedding = null;
    if (typeof employee.faceEmbedding === 'string') {
      storedEmbedding = decryptData(employee.faceEmbedding, true);
    } else if (Array.isArray(employee.faceEmbedding)) {
      storedEmbedding = employee.faceEmbedding;
    }

    if (!Array.isArray(storedEmbedding)) {
      const error = new Error('Stored face embedding is corrupt or invalid format');
      error.statusCode = 500;
      throw error;
    }

    console.log('Stored embedding length:', storedEmbedding.length);
    console.log('Live embedding length:', liveEmbedding.length);

    // 5. Compare with STRICT threshold (distance < 0.50)
    const result = faceService.compareFaces(storedEmbedding, liveEmbedding, 0.50);

    console.log('Distance:', result.distance);
    console.log('Similarity:', result.similarity);
    console.log('Threshold:', result.threshold);
    console.log('Passed:', result.passed);

    if (!result.passed) {
      const error = new Error(
        `Face mismatch (Distance: ${result.distance.toFixed(3)}, Max allowed: ${result.threshold}). Verification failed.`
      );
      error.statusCode = 403;
      error.code = 'FACE_MISMATCH';
      error.score = result.similarity;
      error.distance = result.distance;
      throw error;
    }

    return result;
  }
};

export default attendanceService;

