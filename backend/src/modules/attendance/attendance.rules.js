import prisma from '../../config/prisma.js';
import { DEFAULT_SHIFT_RULES } from './attendance.constants.js';

const companyAttendanceSettingsCache = new Map();
const inFlightSettingsPromises = new Map();

export const attendanceRules = {
  /**
   * Fetch company attendance settings JSON
   */
  async getCompanyAttendanceSettings(companyId) {
    if (!companyId) return {};
    const cached = companyAttendanceSettingsCache.get(companyId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    if (inFlightSettingsPromises.has(companyId)) {
      return inFlightSettingsPromises.get(companyId);
    }

    const queryPromise = (async () => {
      try {
        const company = await prisma.company.findUnique({
          where: { id: companyId },
          select: { attendanceSettings: true }
        });

        const defaults = {
          geoFencing: true,
          faceRecognition: true,
          cardRequired: false,
          gracePeriodMinutes: 15,
          workHoursPerDay: 8,
          minWorkMinutesFullDay: 420,
          minWorkMinutesHalfDay: 240,
          maxDailyBreaks: 3,
          maxBreakMinutesTotal: 60,
          enabledModes: ['face', 'card', 'finger'],
          shiftStart: '09:00',
          shiftEnd: '18:00'
        };

        if (!company?.attendanceSettings) {
          companyAttendanceSettingsCache.set(companyId, { data: defaults, expiresAt: Date.now() + 300000 });
          return defaults;
        }

        const custom =
          typeof company.attendanceSettings === 'string'
            ? JSON.parse(company.attendanceSettings)
            : company.attendanceSettings;

        const result = { ...defaults, ...custom };
        companyAttendanceSettingsCache.set(companyId, { data: result, expiresAt: Date.now() + 300000 });
        return result;
      } finally {
        inFlightSettingsPromises.delete(companyId);
      }
    })();

    inFlightSettingsPromises.set(companyId, queryPromise);
    return queryPromise;
  },

  /**
   * Verify if the requested mode is permitted
   */
  validateModeEnabled(settings, mode) {
    const normMode = String(mode).toLowerCase();
    const enabledModes = (settings.enabledModes || ['face', 'card', 'finger']).map((m) =>
      m.toLowerCase()
    );

    if (!enabledModes.includes(normMode)) {
      throw new Error(
        `Attendance mode '${mode.toUpperCase()}' is currently disabled for your organization.`
      );
    }
    return true;
  },

  /**
   * Calculate late minutes beyond shift start + grace period
   */
  calculateLateMinutes(checkInDate = new Date(), shiftStartStr = '09:00', graceMinutes = 15) {
    const [shiftHour, shiftMinute] = shiftStartStr.split(':').map(Number);
    const expectedTime = new Date(checkInDate);
    expectedTime.setHours(shiftHour, shiftMinute, 0, 0);

    const graceLimit = new Date(expectedTime.getTime() + graceMinutes * 60000);
    const actualTime = new Date(checkInDate);

    if (actualTime > graceLimit) {
      const diffMs = actualTime.getTime() - expectedTime.getTime();
      return Math.round(diffMs / 60000);
    }
    return 0;
  },

  /**
   * Calculate total net worked minutes excluding break intervals
   */
  calculateWorkedMinutes(checkInAt, checkOutAt = new Date(), breaks = []) {
    if (!checkInAt) return 0;
    const start = new Date(checkInAt).getTime();
    const end = new Date(checkOutAt).getTime();

    const grossMinutes = Math.max(0, Math.round((end - start) / 60000));

    // Sum completed break minutes
    let breakMinutes = 0;
    breaks.forEach((b) => {
      if (b.breakStartAt && b.breakEndAt) {
        const bStart = new Date(b.breakStartAt).getTime();
        const bEnd = new Date(b.breakEndAt).getTime();
        breakMinutes += Math.max(0, Math.round((bEnd - bStart) / 60000));
      }
    });

    return Math.max(0, grossMinutes - breakMinutes);
  },

  /**
   * Determine attendance status (PRESENT, HALF_DAY, LATE)
   */
  determineStatus(workedMinutes, settings = DEFAULT_SHIFT_RULES, isLate = false) {
    const minFull = settings.minWorkMinutesFullDay || 420; // 7h
    const minHalf = settings.minWorkMinutesHalfDay || 240; // 4h

    if (workedMinutes >= minFull) {
      return isLate ? 'LATE' : 'PRESENT';
    } else if (workedMinutes >= minHalf) {
      return 'HALF_DAY';
    } else {
      return 'ABSENT';
    }
  },

  /**
   * Validate break limits per day
   */
  validateBreakRules(settings, todayBreaks = []) {
    const maxBreaks = settings.maxDailyBreaks || 3;
    if (todayBreaks.length >= maxBreaks) {
      throw new Error(`Maximum daily breaks limit (${maxBreaks}) has been reached.`);
    }

    // Check if there is an active unended break
    const activeBreak = todayBreaks.find((b) => !b.breakEndAt);
    if (activeBreak) {
      throw new Error('You already have an active break in progress. End current break first.');
    }

    return true;
  },

  /**
   * Validate Device Attestation integrity
   */
  validateDeviceAttestation(settings, attestation) {
    if (settings.requireDeviceAttestation && attestation && !attestation.passed) {
      throw new Error(`Device attestation integrity check failed: ${attestation.failureReason || 'Compromised device'}`);
    }
    return true;
  },

  /**
   * Validate corporate IP Whitelist
   */
  validateIPWhitelist(settings, ipAddress) {
    if (settings.ipWhitelistEnabled && settings.allowedIpRanges && settings.allowedIpRanges.length > 0) {
      if (!ipAddress) {
        throw new Error('IP address validation failed: No IP detected.');
      }
      const allowed = settings.allowedIpRanges;
      const isAllowed = allowed.some((range) => {
        if (range === ipAddress || range === '127.0.0.1' || range === '::1') return true;
        if (range.endsWith('*') && ipAddress.startsWith(range.slice(0, -1))) return true;
        return false;
      });
      if (!isAllowed) {
        throw new Error(`Access Denied: IP address ${ipAddress} is not permitted by corporate security policy.`);
      }
    }
    return true;
  },

  /**
   * Validate VPN detection
   */
  validateVPN(settings, vpnResult) {
    if (settings.blockVpn && vpnResult && vpnResult.isVPN) {
      throw new Error('Access Denied: Virtual Private Network (VPN) or Proxy connection detected.');
    }
    return true;
  }
};

export default attendanceRules;

