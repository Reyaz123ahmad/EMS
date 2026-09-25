import { prisma } from '../config/prisma.js';

export const DEFAULT_SETTINGS = {
  general: {
    locale: 'en-US',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12H',
    workWeekDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    employeeCodePrefix: 'EMP-',
    branding: {
      primaryColor: '#3b82f6',
      logoUrl: null,
      companyDisplayName: '',
    },
    compliance: {
      panNumber: '',
      gstin: '',
      cin: '',
      pfRegistration: '',
      esiRegistration: '',
    },
  },
  attendance: {
    modes: {
      face: true,
      card: true,
      finger: true,
    },
    operations: {
      checkIn: true,
      checkOut: true,
      break: true,
    },
    geofence: {
      enabled: true,
      radiusMeters: 100,
      strictMode: false,
    },
    timeRules: {
      workHoursPerDay: 8,
      gracePeriodMinutes: 15,
      halfDayThresholdHours: 4,
      overtimeThresholdMinutes: 30,
      autoCheckoutAfterHours: 12,
    },
    deviceRules: {
      allowWebCheckIn: true,
      allowMobileCheckIn: true,
      requireDeviceAttestation: true,
    },
    fraudDetection: {
      flagMockLocation: true,
      flagVpnUsage: true,
      minFaceMatchScore: 0.75,
      requireLivenessCheck: true,
    },
    photoRequired: {
      checkIn: true,
      checkOut: true,
    },
    holidayCheck: {
      enabled: true,
      blockAttendanceOnHoliday: true,
      markHolidayAutomatically: true,
    },
    shiftCheck: {
      enabled: true,
      requireShiftAssignment: true,
      blockAttendanceWithoutShift: true,
    },
    lateRules: {
      enabled: true,
      graceMinutes: 15,
      autoExtendCheckout: true,
      extendByLateMinutes: true,
    },
    checkoutRules: {
      enabled: true,
      requireFullHours: true,
      disableButtonUntilFullTime: true,
      workingHours: 8,
    },
    breakRules: {
      enabled: true,
      maxBreaksPerDay: 3,
      maxBreakMinutesPerDay: 60,
      breakTypes: ['LUNCH', 'SHORT'],
      lunchDurationMinutes: 30,
      shortDurationMinutes: 10,
      trackReturnTime: true,
      extendCheckoutOnLateReturn: true,
      disableButtonOnLimit: true,
    },
  },
  security: {
    securityLevel: 'standard', // basic, standard, high, military
    requiredLayers: ['camera', 'liveness', 'face_match', 'geofence', 'device_integrity'],
    livenessSettings: {
      activeChallenges: 3,
      timeoutSeconds: 15,
      minConfidence: 0.85,
    },
    faceMatchSettings: {
      minCosineSimilarity: 0.75,
      embeddingModel: '128D_MOBILENET',
    },
    deviceAttestation: {
      blockRooted: true,
      blockEmulators: true,
      verifySafetyNet: true,
    },
    fraudDetection: {
      alertOnSuspiciousIp: true,
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 30,
    },
    ipWhitelist: [],
    sessionSettings: {
      idleTimeoutMinutes: 60,
      maxConcurrentSessions: 3,
    },
    twoFactorSettings: {
      enforceForAdmins: true,
      enforceForEmployees: false,
      methods: ['AUTHENTICATOR', 'EMAIL_OTP'],
    },
  },
  leave: {
    yearStartMonth: 1, // January
    carryForwardAllowed: true,
    maxCarryForwardDays: 10,
    probationLeaveAllowed: false,
    sandwichRuleEnabled: false,
    requireMedicalCertificateDays: 3,
    approvalWorkflow: 'MANAGER_THEN_HR',
  },
  payroll: {
    payCycle: 'MONTHLY',
    payDayOfMonth: 1,
    standardMonthlyDays: 30,
    pfEnabled: true,
    pfEmployerPercent: 12.0,
    pfEmployeePercent: 12.0,
    esiEnabled: true,
    esiThreshold: 21000,
    tdsDeductionEnabled: true,
    overtimeMultiplier: 1.5,
  },
  notifications: {
    channels: {
      email: true,
      sms: false,
      push: true,
      inApp: true,
    },
    events: {
      attendancePunched: true,
      leaveRequested: true,
      leaveStatusChanged: true,
      payrollGenerated: true,
      securityAlert: true,
      overtimeClaimed: true,
    },
    recipients: {
      adminEmails: [],
      hrEmails: [],
    },
  },
};

export const settingsService = {
  getDefaultSettings(settingType) {
    return DEFAULT_SETTINGS[settingType] || {};
  },

  getSettingsSchema() {
    return DEFAULT_SETTINGS;
  },

  validateSettings(settingType, data) {
    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid settings payload for ${settingType}`);
    }
    return true;
  },

  mergeSettings(current = {}, updates = {}) {
    return {
      ...current,
      ...updates,
    };
  },

  async getSettingsWithDefaults(companyId, settingType) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new Error('Company not found');

    const fieldMap = {
      general: 'generalSettings',
      attendance: 'attendanceSettings',
      security: 'securitySettings',
      leave: 'leaveSettings',
      payroll: 'payrollSettings',
      notifications: 'notificationSettings',
    };

    const fieldName = fieldMap[settingType];
    const currentJson = (company[fieldName] && typeof company[fieldName] === 'object') ? company[fieldName] : {};
    const defaultJson = DEFAULT_SETTINGS[settingType] || {};

    return {
      ...defaultJson,
      ...currentJson,
    };
  },

  async updateSettings(companyId, settingType, updates) {
    this.validateSettings(settingType, updates);
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error('Company not found');

    const fieldMap = {
      general: 'generalSettings',
      attendance: 'attendanceSettings',
      security: 'securitySettings',
      leave: 'leaveSettings',
      payroll: 'payrollSettings',
      notifications: 'notificationSettings',
    };

    const fieldName = fieldMap[settingType];
    const currentJson = company[fieldName] || {};
    const merged = this.mergeSettings(currentJson, updates);

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        [fieldName]: merged,
      },
    });

    return {
      settingType,
      settings: updatedCompany[fieldName],
      status: 'UPDATED',
    };
  },

  async resetSettings({ companyId, settingType }) {
    const defaultJson = DEFAULT_SETTINGS[settingType];
    if (!defaultJson) throw new Error(`Unknown setting type: ${settingType}`);

    return this.updateSettings(companyId, settingType, defaultJson);
  },
};
