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

export const attendanceService = {
  /**
   * 1. Multi-Layer Check-In
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

    // 3. Validate Mode Permission
    attendanceRules.validateModeEnabled(settings, mode);

    // 4. Check for existing check-in today
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

    // 5. Layer 1: Location & Geo-fencing Attestation
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

    // 6. Layer 2: Device & Network Attestation
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


    // 7. Layer 3: Mode-Specific Biometric Verification
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

    // 8. Calculate Late Time from Shift Start
    const lateMinutes = attendanceRules.calculateLateMinutes(
      new Date(),
      settings.shiftStart || '09:00',
      settings.gracePeriodMinutes || 15
    );

    const initialStatus = lateMinutes > 0 ? 'LATE' : 'PRESENT';

    // 9. Persist Attendance Log
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
      lateMinutes,
      status: initialStatus,
      remarks
    });

    return {
      attendance: log,
      verificationLayers,
      message: `Check-in successful at ${new Date().toLocaleTimeString()} (${initialStatus}).`
    };
  },

  /**
   * 2. Check-Out
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
    const totalWorkedMinutes = attendanceRules.calculateWorkedMinutes(
      todayLog.checkInAt,
      checkOutTime,
      todayLog.breaks
    );

    const standardMinutes = (settings.workHoursPerDay || 8) * 60;
    const overtimeMinutes = Math.max(0, totalWorkedMinutes - standardMinutes);

    const finalStatus = attendanceRules.determineStatus(
      totalWorkedMinutes,
      settings,
      todayLog.lateMinutes > 0
    );

    const updatedLog = await attendanceRepository.updateAttendanceLog(todayLog.id, {
      checkOutAt: checkOutTime,
      checkOutPhotoUrl: photo || null,
      checkOutLatitude: location?.lat,
      checkOutLongitude: location?.lng,
      checkOutAccuracy: location?.accuracy,
      totalWorkedMinutes,
      overtimeMinutes,
      status: finalStatus,
      remarks: remarks ? `${todayLog.remarks ? todayLog.remarks + ' | ' : ''}${remarks}` : todayLog.remarks
    });

    return {
      attendance: updatedLog,
      totalHours: Math.round((totalWorkedMinutes / 60) * 10) / 10,
      overtimeHours: Math.round((overtimeMinutes / 60) * 10) / 10,
      status: finalStatus,
      message: `Check-out successful at ${checkOutTime.toLocaleTimeString()}. Total worked: ${Math.round((totalWorkedMinutes / 60) * 10) / 10} hrs.`
    };
  },

  /**
   * 3. Start Break
   */
  async startBreak({ employeeId, companyId, breakType = 'SHORT', photo, remarks }) {
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
    attendanceRules.validateBreakRules(settings, todayLog.breaks);

    const newBreak = await attendanceRepository.createAttendanceBreak({
      attendanceLogId: todayLog.id,
      employeeId: empId,
      breakStartAt: new Date(),
      breakType: breakType.toUpperCase(),
      breakPhotoUrl: photo || null
    });

    return {
      break: newBreak,
      message: `Break started (${breakType.toUpperCase()}) at ${new Date().toLocaleTimeString()}.`
    };
  },

  /**
   * 4. End Break
   */
  async endBreak({ employeeId, companyId, remarks }) {
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

    const endTime = new Date();
    const startTime = new Date(activeBreak.breakStartAt);
    const durationMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));

    const updatedBreak = await attendanceRepository.updateAttendanceBreak(activeBreak.id, {
      breakEndAt: endTime,
      totalBreakMinutes: durationMinutes
    });

    return {
      break: updatedBreak,
      durationMinutes,
      message: `Break concluded. Total duration: ${durationMinutes} mins.`
    };
  },

  /**
   * 5. Get Today's Status
   */
  async getTodayStatus(employeeId, companyId) {
    const employee = await attendanceRepository.findEmployeeWithBranch(employeeId);
    const empId = employee ? employee.id : employeeId;

    const attendance = await attendanceRepository.findTodayAttendance(empId);
    const breaks = attendance ? await attendanceRepository.findTodayBreaks(attendance.id) : [];

    return {
      attendance,
      breaks,
      isCheckedIn: Boolean(attendance && attendance.checkInAt && !attendance.checkOutAt),
      isOnBreak: Boolean(breaks.some((b) => !b.breakEndAt)),
      date: new Date().toISOString().split('T')[0]
    };
  },

  /**
   * 6. List Attendance Logs
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

  }
};

export default attendanceService;

