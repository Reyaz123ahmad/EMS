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

export const attendanceService = {
  /**
   * 1. Holiday Check (FestivalHoliday & HolidayCalendar)
   */
  async checkHoliday(companyId, date = new Date()) {
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();

    const calendar = await prisma.holidayCalendar.findFirst({
      where: {
        companyId,
        year,
        isActive: true
      },
      include: {
        holidays: true
      }
    });

    if (!calendar || !calendar.holidays || calendar.holidays.length === 0) {
      return { isHoliday: false, holiday: null };
    }

    const targetDateStr = targetDate.toISOString().slice(0, 10);
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
   * 2. Shift Assignment Check
   */
  async checkShiftAssignment(employeeId, date = new Date(), companyId = null) {
    const targetDate = new Date(date);

    // 1. Check ShiftAssignment
    const assignment = await prisma.shiftAssignment.findFirst({
      where: {
        employeeId,
        effectiveFrom: { lte: targetDate },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: targetDate } }
        ]
      },
      include: {
        shift: true
      },
      orderBy: { effectiveFrom: 'desc' }
    });

    if (assignment && assignment.shift && assignment.shift.isActive) {
      const s = assignment.shift;
      return {
        hasShift: true,
        shift: {
          id: s.id,
          name: s.name,
          startTime: s.startTime || '09:00',
          endTime: s.endTime || '18:00',
          graceMinutes: s.graceMinutes !== undefined ? s.graceMinutes : 15,
          workingHours: s.workingHours || 8,
          isNightShift: s.isNightShift || false
        }
      };
    }

    // 2. Check Roster
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const roster = await prisma.roster.findFirst({
      where: {
        employeeId,
        date: startOfDay,
        isPublished: true
      },
      include: { shift: true }
    });

    if (roster && roster.shift && roster.shift.isActive) {
      const s = roster.shift;
      return {
        hasShift: true,
        shift: {
          id: s.id,
          name: s.name,
          startTime: s.startTime || '09:00',
          endTime: s.endTime || '18:00',
          graceMinutes: s.graceMinutes !== undefined ? s.graceMinutes : 15,
          workingHours: s.workingHours || 8,
          isNightShift: s.isNightShift || false
        }
      };
    }

    // 3. Fallback to active company default shift if available
    if (companyId) {
      const defaultShift = await prisma.shift.findFirst({
        where: { companyId, isActive: true },
        orderBy: { createdAt: 'asc' }
      });
      if (defaultShift) {
        return {
          hasShift: true,
          shift: {
            id: defaultShift.id,
            name: defaultShift.name,
            startTime: defaultShift.startTime || '09:00',
            endTime: defaultShift.endTime || '18:00',
            graceMinutes: defaultShift.graceMinutes !== undefined ? defaultShift.graceMinutes : 15,
            workingHours: defaultShift.workingHours || 8,
            isNightShift: defaultShift.isNightShift || false
          }
        };
      }
    }

    return { hasShift: false, shift: null };
  },

  /**
   * 3. Shift Timing Calculation (Late / On-time)
   */
  calculateLateMinutes(checkInTime = new Date(), shift, graceMinutes = 15) {
    const shiftStartTime = shift?.startTime || '09:00';
    const effectiveGrace = shift?.graceMinutes !== undefined ? shift.graceMinutes : graceMinutes;

    const [startH, startM] = shiftStartTime.split(':').map(Number);
    const expectedCheckInDate = new Date(checkInTime);
    expectedCheckInDate.setHours(startH, startM, 0, 0);

    const graceLimitDate = new Date(expectedCheckInDate.getTime() + effectiveGrace * 60000);
    const actualCheckIn = new Date(checkInTime);

    let lateMinutes = 0;
    if (actualCheckIn > graceLimitDate) {
      lateMinutes = Math.max(0, Math.round((actualCheckIn.getTime() - expectedCheckInDate.getTime()) / 60000));
    }

    return {
      isLate: lateMinutes > 0,
      lateMinutes,
      expectedCheckIn: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`
    };
  },

  /**
   * 4. Check Break Limit & Status
   */
  async checkBreakLimit(employeeId, companyId) {
    const employee = await attendanceRepository.findEmployeeWithBranch(employeeId);
    const empId = employee ? employee.id : employeeId;
    const realCompanyId = companyId || employee?.companyId;

    const settings = await attendanceRules.getCompanyAttendanceSettings(realCompanyId);
    const breakRules = settings.breakRules || {};

    const maxBreaks = breakRules.maxBreaksPerDay || 3;
    const maxBreakMinutes = breakRules.maxBreakMinutesPerDay || 60;
    const lunchDuration = breakRules.lunchDurationMinutes || 30;
    const shortDuration = breakRules.shortDurationMinutes || 10;
    const breakTypes = breakRules.breakTypes || ['LUNCH', 'SHORT'];

    const todayLog = await attendanceRepository.findTodayAttendance(empId);
    const breaks = todayLog?.breaks || [];

    let totalBreakMinutes = 0;
    let activeBreak = null;

    breaks.forEach((b) => {
      if (!b.breakEndAt) {
        activeBreak = b;
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

    let canTakeBreak = true;
    let reason = 'You can take a break.';

    if (activeBreak) {
      canTakeBreak = false;
      reason = 'You already have an active break in progress.';
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
      hasActiveBreak: Boolean(activeBreak),
      activeBreak,
      reason
    };
  },

  /**
   * 5. Can Checkout Status & Validation
   */
  async canCheckout(employeeId, companyId) {
    const employee = await attendanceRepository.findEmployeeWithBranch(employeeId);
    const empId = employee ? employee.id : employeeId;
    const realCompanyId = companyId || employee?.companyId;

    const settings = await attendanceRules.getCompanyAttendanceSettings(realCompanyId);
    const checkoutRules = settings.checkoutRules || {};

    const todayLog = await attendanceRepository.findTodayAttendance(empId);
    if (!todayLog || !todayLog.checkInAt) {
      return {
        canCheckout: false,
        remainingMinutes: 0,
        expectedCheckoutTime: null,
        actualMinutes: 0,
        requiredMinutes: (checkoutRules.workingHours || 8) * 60,
        shortfallMinutes: (checkoutRules.workingHours || 8) * 60,
        reason: 'You have not checked in today.'
      };
    }

    if (todayLog.checkOutAt) {
      return {
        canCheckout: false,
        remainingMinutes: 0,
        expectedCheckoutTime: todayLog.checkOutAt.toISOString(),
        actualMinutes: todayLog.totalWorkedMinutes || 0,
        requiredMinutes: todayLog.requiredMinutes || (checkoutRules.workingHours || 8) * 60,
        shortfallMinutes: 0,
        reason: 'You have already checked out for today.'
      };
    }

    const requiredMinutes = todayLog.requiredMinutes || (checkoutRules.workingHours || 8) * 60;

    const now = new Date();
    const actualMinutes = attendanceRules.calculateWorkedMinutes(todayLog.checkInAt, now, todayLog.breaks);
    const shortfallMinutes = Math.max(0, requiredMinutes - actualMinutes);

    let expectedCheckoutTime = todayLog.adjustedCheckOutTime;
    if (!expectedCheckoutTime) {
      expectedCheckoutTime = new Date(new Date(todayLog.checkInAt).getTime() + (requiredMinutes + (todayLog.totalBreakMinutes || 0)) * 60000);
    }

    const isFullHoursMet = actualMinutes >= requiredMinutes;
    const isPastExpectedTime = now.getTime() >= new Date(expectedCheckoutTime).getTime();

    const requireFull = checkoutRules.requireFullHours !== false && checkoutRules.disableButtonUntilFullTime !== false;
    const canCheckout = !requireFull || isFullHoursMet || isPastExpectedTime;

    let reason = 'You can check out now.';
    if (!canCheckout) {
      reason = `You need to work ${shortfallMinutes} more minutes. Checkout will be enabled at ${new Date(expectedCheckoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    }

    return {
      canCheckout,
      remainingMinutes: shortfallMinutes,
      expectedCheckoutTime: new Date(expectedCheckoutTime).toISOString(),
      actualMinutes,
      requiredMinutes,
      shortfallMinutes,
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
    // 1. Fetch employee profile & branch
    const employee = await attendanceRepository.findEmployeeWithBranch(employeeId);
    if (!employee) {
      throw new Error('Employee record not found.');
    }
    const empId = employee.id;

    // 2. Fetch company attendance settings & rules
    const settings = await attendanceRules.getCompanyAttendanceSettings(companyId);

    // 3. Rule 1: Holiday Check
    const holidayInfo = await this.checkHoliday(companyId, new Date());
    if (holidayInfo.isHoliday && settings.holidayCheck?.blockAttendanceOnHoliday !== false) {
      if (settings.holidayCheck?.markHolidayAutomatically !== false) {
        // Upsert holiday log if not existing
        const existing = await attendanceRepository.findTodayAttendance(empId);
        if (!existing) {
          await attendanceRepository.createAttendanceLog({
            companyId,
            employeeId: empId,
            attendanceDate: new Date(),
            status: 'HOLIDAY',
            isHoliday: true,
            holidayName: holidayInfo.holiday.name,
            holidayType: holidayInfo.holiday.type,
            remarks: `Official Holiday: ${holidayInfo.holiday.name}`
          });
        }
      }
      const err = new Error(`Today is a holiday: ${holidayInfo.holiday.name}. Attendance not required.`);
      err.statusCode = 400;
      throw err;
    }

    // 4. Rule 2: Shift Assignment Check
    const shiftInfo = await this.checkShiftAssignment(empId, new Date(), companyId);
    if (!shiftInfo.hasShift && settings.shiftCheck?.blockAttendanceWithoutShift !== false) {
      const err = new Error('No shift assigned. Contact HR to assign a shift.');
      err.statusCode = 400;
      throw err;
    }
    const assignedShift = shiftInfo.shift;

    // 5. Validate Mode Permission
    attendanceRules.validateModeEnabled(settings, mode);

    // 6. Check for existing check-in today
    const todayLog = await attendanceRepository.findTodayAttendance(empId);
    if (todayLog && todayLog.checkInAt) {
      const err = new Error('You have already checked in for today.');
      err.statusCode = 400;
      throw err;
    }

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

      const card = await attendanceRepository.findCardByNumber(companyId, cardNumber);
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
    const graceMinutes = settings.lateRules?.graceMinutes || assignedShift?.graceMinutes || settings.gracePeriodMinutes || 15;
    const lateCalc = this.calculateLateMinutes(new Date(), assignedShift, graceMinutes);
    const isLate = lateCalc.isLate;
    const lateMinutes = lateCalc.lateMinutes;
    const initialStatus = isLate ? 'LATE' : 'PRESENT';

    // 11. Rule 4: Auto Checkout Extension (Adjusted Checkout Time)
    const [endH, endM] = (assignedShift?.endTime || '18:00').split(':').map(Number);
    const shiftEndDate = new Date();
    shiftEndDate.setHours(endH, endM, 0, 0);

    let adjustedCheckOutTime = shiftEndDate;
    if (isLate && settings.lateRules?.autoExtendCheckout !== false) {
      adjustedCheckOutTime = new Date(shiftEndDate.getTime() + lateMinutes * 60000);
    }

    const requiredMinutes = (assignedShift?.workingHours || settings.checkoutRules?.workingHours || 8) * 60;
    const maxBreaks = settings.breakRules?.maxBreaksPerDay || 3;
    const maxBreakMins = settings.breakRules?.maxBreakMinutesPerDay || 60;

    // 12. Persist Attendance Log
    const log = await attendanceRepository.createAttendanceLog({
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
      isLate,
      lateMinutes,
      adjustedCheckOutTime,
      requiredMinutes,
      totalBreaks: 0,
      totalBreakMinutes: 0,
      remainingBreaks: maxBreaks,
      remainingBreakMinutes: maxBreakMins,
      status: initialStatus,
      remarks
    });

    return {
      attendance: log,
      verificationLayers,
      shift: assignedShift,
      isLate,
      lateMinutes,
      adjustedCheckOutTime: adjustedCheckOutTime.toISOString(),
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
    const employee = await attendanceRepository.findEmployeeWithBranch(employeeId);
    if (!employee) {
      throw new Error('Employee record not found.');
    }
    const empId = employee.id;

    const todayLog = await attendanceRepository.findTodayAttendance(empId);
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

    const settings = await attendanceRules.getCompanyAttendanceSettings(companyId);

    // Rule 1: Holiday Check
    const holidayInfo = await this.checkHoliday(companyId, new Date());
    if (holidayInfo.isHoliday && settings.holidayCheck?.blockAttendanceOnHoliday !== false) {
      const err = new Error(`Today is a holiday: ${holidayInfo.holiday.name}. Attendance operations are locked.`);
      err.statusCode = 400;
      throw err;
    }

    // Rule 5: Auto Checkout Extension & Working Hours Check
    const checkoutStatus = await this.canCheckout(empId, companyId);
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
      actualMinutes,
      shortfallMinutes: 0,
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
    const employee = await attendanceRepository.findEmployeeWithBranch(employeeId);
    if (!employee) {
      throw new Error('Employee record not found.');
    }
    const empId = employee.id;

    const todayLog = await attendanceRepository.findTodayAttendance(empId);
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

    const settings = await attendanceRules.getCompanyAttendanceSettings(companyId);

    // Rule 1: Holiday Check
    const holidayInfo = await this.checkHoliday(companyId, new Date());
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
    const limitCheck = await this.checkBreakLimit(empId, companyId);
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

    const newBreak = await attendanceRepository.createAttendanceBreak({
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
    });

    // Update break counters in AttendanceLog
    await attendanceRepository.updateAttendanceLog(todayLog.id, {
      totalBreaks: limitCheck.totalBreaks + 1,
      remainingBreaks: Math.max(0, limitCheck.remainingBreaks - 1)
    });

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
    mode = 'face',
    photo,
    location,
    deviceInfo = {},
    cardNumber,
    remarks,
    livenessScore = 0.95
  }) {
    const employee = await attendanceRepository.findEmployeeWithBranch(employeeId);
    if (!employee) {
      throw new Error('Employee record not found.');
    }
    const empId = employee.id;

    const activeBreak = await attendanceRepository.findActiveBreak(empId);
    if (!activeBreak) {
      const err = new Error('No active break found to end.');
      err.statusCode = 400;
      throw err;
    }

    const todayLog = await attendanceRepository.findTodayAttendance(empId);
    const settings = await attendanceRules.getCompanyAttendanceSettings(companyId);

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

    let warningMessage = null;
    if (lateReturnMinutes > 0) {
      warningMessage = `You returned ${lateReturnMinutes} minutes late. Your expected checkout time has been extended.`;

      // Extend adjustedCheckOutTime in AttendanceLog
      if (todayLog && settings.breakRules?.extendCheckoutOnLateReturn !== false) {
        let baseAdj = todayLog.adjustedCheckOutTime ? new Date(todayLog.adjustedCheckOutTime) : new Date();
        const updatedAdjTime = new Date(baseAdj.getTime() + lateReturnMinutes * 60000);
        await attendanceRepository.updateAttendanceLog(todayLog.id, {
          adjustedCheckOutTime: updatedAdjTime
        });
      }
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

    // Update cumulative break minutes in AttendanceLog
    if (todayLog) {
      const totalBreakMinutes = (todayLog.totalBreakMinutes || 0) + durationMinutes;
      const maxAllowed = settings.breakRules?.maxBreakMinutesPerDay || 60;
      await attendanceRepository.updateAttendanceLog(todayLog.id, {
        totalBreakMinutes,
        remainingBreakMinutes: Math.max(0, maxAllowed - totalBreakMinutes)
      });
    }

    return {
      break: updatedBreak,
      durationMinutes,
      lateReturnMinutes,
      warning: warningMessage,
      message: warningMessage || `Break concluded. Total duration: ${durationMinutes} mins.`
    };
  },

  /**
   * 10. Get Today's Status (Consolidated Holiday, Shift, Break & Checkout Info)
   */
  async getTodayStatus(employeeId, companyId) {
    const employee = await attendanceRepository.findEmployeeWithBranch(employeeId);
    const empId = employee ? employee.id : employeeId;
    const realCompanyId = companyId || employee?.companyId;

    const attendance = await attendanceRepository.findTodayAttendance(empId);
    const breaks = attendance ? await attendanceRepository.findTodayBreaks(attendance.id) : [];

    const holidayInfo = await this.checkHoliday(realCompanyId, new Date());
    const shiftInfo = await this.checkShiftAssignment(empId, new Date(), realCompanyId);
    const checkoutStatus = await this.canCheckout(empId, realCompanyId);
    const breakStatus = await this.checkBreakLimit(empId, realCompanyId);

    return {
      attendance,
      breaks,
      isCheckedIn: Boolean(attendance && attendance.checkInAt && !attendance.checkOutAt),
      isOnBreak: Boolean(breaks.some((b) => !b.breakEndAt)),
      date: new Date().toISOString().split('T')[0],
      holiday: holidayInfo,
      shift: shiftInfo,
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
   * 7. Monthly Summary
   */
  async getMonthlySummary(companyId, month, year, filters) {
    return attendanceRepository.getMonthlySummary(companyId, month, year, filters);
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
  async getMonthlySummary(companyId, month, year, filters = {}) {
    const targetMonth = month ? Number(month) - 1 : new Date().getMonth();
    const targetYear = year ? Number(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const where = {
      companyId,
      attendanceDate: { gte: startDate, lte: endDate },
      ...(filters.departmentId ? { employee: { departmentId: filters.departmentId } } : {}),
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {})
    };

    const logs = await prisma.attendanceLog.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      }
    });

    const presentDays = logs.filter(l => ['PRESENT', 'LATE', 'HALF_DAY'].includes(l.status) || l.checkInTime || l.checkInAt).length;
    const absentDays = logs.filter(l => l.status === 'ABSENT').length;
    const halfDays = logs.filter(l => l.status === 'HALF_DAY').length;
    const lateDays = logs.filter(l => l.status === 'LATE' || l.isLate).length;
    const totalWorkingDays = new Date(targetYear, targetMonth + 1, 0).getDate();

    const totalWorkedMinutes = logs.reduce((sum, l) => sum + (l.totalWorkedMinutes || 0), 0);
    const totalOvertimeMinutes = logs.reduce((sum, l) => sum + (l.overtimeMinutes || 0), 0);

    const punctualityRate = presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 100;

    return {
      month: targetMonth + 1,
      year: targetYear,
      presentDays,
      absentDays,
      halfDays,
      lateDays,
      totalWorkingDays,
      totalHours: Math.round((totalWorkedMinutes / 60) * 10) / 10,
      overtimeHours: Math.round((totalOvertimeMinutes / 60) * 10) / 10,
      totalOvertimeHours: Math.round((totalOvertimeMinutes / 60) * 10) / 10,
      punctualityRate: isNaN(punctualityRate) ? 100 : punctualityRate,
      totalLogs: logs.length,
      logs
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

    // 2. Generate embedding from LIVE photo
    const liveEmbedding = await faceService.generateEmbedding(photoBase64);

    console.log('Live embedding generated:', !!liveEmbedding);

    if (!liveEmbedding || liveEmbedding.length === 0) {
      const error = new Error('No face detected in live photo');
      error.statusCode = 400;
      error.code = 'NO_FACE_DETECTED';
      throw error;
    }

    // 3. Decrypt stored embedding
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

    // 4. Compare with STRICT threshold
    const result = faceService.compareFaces(storedEmbedding, liveEmbedding, 0.75);

    console.log('Similarity:', result.similarity);
    console.log('Threshold:', result.threshold);
    console.log('Passed:', result.passed);

    if (!result.passed) {
      const error = new Error(
        `Face mismatch (${Math.round(result.similarity * 100)}% match). ` +
        `Required: ${Math.round(result.threshold * 100)}%`
      );
      error.statusCode = 403;
      error.code = 'FACE_MISMATCH';
      error.score = result.similarity;
      throw error;
    }

    return result;
  }
};

export default attendanceService;

