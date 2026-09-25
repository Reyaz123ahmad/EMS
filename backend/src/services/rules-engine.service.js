import { settingsService } from './settings.service.js';

export const rulesEngineService = {
  async loadCompanySettings(companyId) {
    const [general, attendance, security, leave, payroll] = await Promise.all([
      settingsService.getSettingsWithDefaults(companyId, 'general'),
      settingsService.getSettingsWithDefaults(companyId, 'attendance'),
      settingsService.getSettingsWithDefaults(companyId, 'security'),
      settingsService.getSettingsWithDefaults(companyId, 'leave'),
      settingsService.getSettingsWithDefaults(companyId, 'payroll'),
    ]);

    return { general, attendance, security, leave, payroll };
  },

  async validateAttendancePunch(companyId, punchData) {
    const settings = await settingsService.getSettingsWithDefaults(companyId, 'attendance');
    const errors = [];

    if (settings.fraudDetection?.flagMockLocation && punchData.isMockLocation) {
      errors.push('Mock location spoofing detected and prohibited by policy');
    }

    if (settings.fraudDetection?.flagVpnUsage && punchData.isVpnDetected) {
      errors.push('VPN / Proxy network detected');
    }

    if (settings.geofence?.enabled && settings.geofence?.strictMode && punchData.distance > settings.geofence.radiusMeters) {
      errors.push(`Punch location is outside strict ${settings.geofence.radiusMeters}m geofence`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      settings,
    };
  },

  async calculateWorkHoursStatus(companyId, workedMinutes) {
    const settings = await settingsService.getSettingsWithDefaults(companyId, 'attendance');
    const { workHoursPerDay = 8, halfDayThresholdHours = 4, gracePeriodMinutes = 15 } = settings.timeRules || {};

    const fullMinutes = workHoursPerDay * 60;
    const halfMinutes = halfDayThresholdHours * 60;

    if (workedMinutes >= fullMinutes - gracePeriodMinutes) {
      return 'FULL_DAY';
    } else if (workedMinutes >= halfMinutes) {
      return 'HALF_DAY';
    } else {
      return 'ABSENT';
    }
  },
};
