export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_INACTIVE: 'Your account is inactive. Contact admin.',
  USER_LOCKED: 'Your account is locked. Contact admin.',
  TOKEN_EXPIRED: 'Session expired. Please login again.',
  TOKEN_INVALID: 'Invalid authentication token.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You do not have permission to access this resource.',

  // Company
  COMPANY_NOT_FOUND: 'Company not found',
  COMPANY_INACTIVE: 'Company account is inactive',
  COMPANY_REQUIRED: 'Company ID is required',

  // Subscription
  SUBSCRIPTION_NOT_FOUND: 'No active subscription found',
  SUBSCRIPTION_EXPIRED: 'Your subscription has expired. Please renew.',
  SUBSCRIPTION_REQUIRED: 'Active subscription required',
  PLATFORM_ADMIN_NO_SUBSCRIPTION: 'Platform Super Admin does not require a subscription',
  PLATFORM_ADMIN_NOT_ALLOWED: 'This feature is only available for company users. Platform Super Admin cannot access this.',

  // Employee
  EMPLOYEE_NOT_FOUND: 'Employee not found',
  EMPLOYEE_CODE_EXISTS: 'Employee code already exists',
  EMPLOYEE_EMAIL_EXISTS: 'Employee email already exists',

  // Attendance
  ATTENDANCE_NOT_FOUND: 'Attendance record not found',
  ALREADY_CHECKED_IN: 'You have already checked in today',
  NOT_CHECKED_IN: 'You have not checked in yet',
  ALREADY_CHECKED_OUT: 'You have already checked out today',
  HOLIDAY_TODAY: 'Today is a holiday. Attendance not required.',
  NO_SHIFT_ASSIGNED: 'No shift assigned. Contact HR.',
  BREAK_LIMIT_REACHED: 'Break limit reached for today',
  NOT_ENOUGH_HOURS: 'You need to work more hours before checkout',

  // Leave
  LEAVE_NOT_FOUND: 'Leave request not found',
  LEAVE_BALANCE_INSUFFICIENT: 'Insufficient leave balance',
  LEAVE_ALREADY_APPROVED: 'Leave already approved',

  // Document
  DOCUMENT_NOT_FOUND: 'Document not found',
  DOCUMENT_ALREADY_VERIFIED: 'Document already verified',
  FILE_TOO_LARGE: 'File size exceeds the limit',
  INVALID_FILE_TYPE: 'Invalid file type',

  // Aadhaar
  AADHAAR_INVALID: 'Invalid Aadhaar number',
  AADHAAR_ALREADY_REGISTERED: 'Aadhaar already registered',
  AADHAAR_OTP_EXPIRED: 'OTP expired. Please request again.',
  AADHAAR_OTP_INVALID: 'Invalid OTP',
  AADHAAR_MAX_ATTEMPTS: 'Maximum attempts exceeded. Please try again later.',
  AADHAAR_RATE_LIMIT: 'Too many OTP requests. Please try again later.',

  // Payment
  PAYMENT_NOT_FOUND: 'Payment not found',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  REFUND_NOT_FOUND: 'Refund request not found',
  REFUND_ALREADY_PROCESSED: 'Refund already processed',
  REFUND_AMOUNT_EXCEEDS: 'Refund amount exceeds payment amount',

  // AI
  AI_RATE_LIMIT: 'AI quota exceeded. Please try again later.',
  AI_NOT_CONFIGURED: 'AI service not configured',
  AI_GENERATION_FAILED: 'AI generation failed. Please try again.',

  // Generic
  VALIDATION_FAILED: 'Validation failed',
  RECORD_NOT_FOUND: 'Record not found',
  RECORD_EXISTS: 'Record already exists',
  INVALID_DATA: 'Invalid data provided',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
  DATABASE_ERROR: 'Database operation failed',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.'
};

export default ERROR_MESSAGES;
