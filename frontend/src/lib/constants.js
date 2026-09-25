export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  COMPANIES: {
    BASE: '/companies',
    SEND_OTP: '/companies/otp/send',
    VERIFY_OTP: '/companies/otp/verify'
  },
  EMPLOYEES: {
    BASE: '/employees',
    SEND_OTP: '/employees/otp/send',
    VERIFY_OTP: '/employees/otp/verify'
  },
  ATTENDANCE: {
    LOGS: '/attendance/logs',
    CHECK_IN: '/attendance/check-in',
    CHECK_OUT: '/attendance/check-out',
    BREAKS: '/attendance/breaks',
    EMERGENCY: '/attendance/emergency'
  },
  LEAVES: {
    BASE: '/leaves',
    BALANCES: '/leaves/balances',
    TYPES: '/leaves/types'
  },
  PAYROLL: {
    RUNS: '/payroll/runs',
    SLIPS: '/payroll/slips'
  }
};

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  HR_ADMIN: 'HR_ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  CLIENT: 'CLIENT'
};

export const PLANS = {
  BASIC: 'Basic',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise'
};

export const FEATURES = {
  ATTENDANCE: 'attendance',
  LEAVE: 'leave',
  PAYROLL: 'payroll',
  OVERTIME: 'overtime',
  ASSETS: 'assets',
  CERTIFICATES: 'certificates',
  PROJECTS: 'projects',
  PERFORMANCE: 'performance'
};

export const ATTENDANCE_MODES = {
  FACE: 'FACE',
  CARD: 'CARD',
  FINGERPRINT: 'FINGERPRINT',
  GEOFENCE: 'GEOFENCE',
  HYBRID: 'HYBRID'
};
