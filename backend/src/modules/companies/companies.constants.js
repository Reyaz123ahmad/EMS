export const COMPANY_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TRIAL: 'TRIAL',
  EXPIRED: 'EXPIRED'
};

export const DEFAULT_TRIAL_DAYS = 14;

export const COMPANY_SETTINGS_DEFAULTS = {
  attendanceSettings: {
    modes: ['FACE', 'CARD'],
    geofenceActive: true,
    defaultGeofenceRadius: 100,
    allowMockLocation: false,
    requireLiveness: true,
    livenessThreshold: 0.85,
    autoCheckOutAfterHours: 12,
    graceMinutes: 15
  },
  securitySettings: {
    twoFactorAuth: 'OPTIONAL', // REQUIRED, OPTIONAL, DISABLED
    ipWhitelisting: false,
    allowedIps: [],
    sessionTimeoutMinutes: 60,
    maxFailedLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    deviceAttestation: true
  },
  leaveSettings: {
    fiscalYearStartMonth: 1, // January
    autoApprovalDays: 0,
    allowNegativeBalance: false,
    requireAttachmentDays: 3,
    carryForwardLimit: 10
  },
  payrollSettings: {
    currency: 'INR',
    payDay: 1,
    taxDeductionEnabled: true,
    pfEnabled: true,
    esiEnabled: true,
    overtimeCalculationRate: 1.5
  },
  notificationSettings: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    dailyAttendanceDigest: true,
    notifyOnLeaveRequest: true,
    notifyOnPunchAnomaly: true
  },
  generalSettings: {
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    theme: 'dark',
    logoUrl: null
  }
};

export default {
  COMPANY_STATUS,
  DEFAULT_TRIAL_DAYS,
  COMPANY_SETTINGS_DEFAULTS
};
