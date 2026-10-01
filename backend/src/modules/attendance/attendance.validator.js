import Joi from 'joi';

const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  accuracy: Joi.number().min(0).default(10),
  source: Joi.string().default('gps'),
  timestamp: Joi.number().optional()
}).required();

const deviceInfoSchema = Joi.object({
  deviceId: Joi.string().optional().allow('', null),
  isMockLocation: Joi.boolean().default(false),
  ipAddress: Joi.string().optional().allow('', null),
  userAgent: Joi.string().optional().allow('', null),
  platform: Joi.string().optional().allow('', null),
  osVersion: Joi.string().optional().allow('', null),
  appVersion: Joi.string().optional().allow('', null)
}).default({});

export const checkInSchema = Joi.object({
  mode: Joi.string()
    .valid('face', 'card', 'finger', 'FACE', 'CARD', 'FINGER')
    .default('face'),
  photo: Joi.string().optional().allow('', null),
  location: locationSchema,
  deviceInfo: deviceInfoSchema,
  cardNumber: Joi.string().optional().allow('', null),
  remarks: Joi.string().max(500).optional().allow('', null),
  livenessScore: Joi.number().min(0).max(1).optional()
});

export const checkOutSchema = Joi.object({
  mode: Joi.string()
    .valid('face', 'card', 'finger', 'FACE', 'CARD', 'FINGER')
    .default('face'),
  photo: Joi.string().optional().allow('', null),
  location: locationSchema,
  deviceInfo: deviceInfoSchema,
  cardNumber: Joi.string().optional().allow('', null),
  remarks: Joi.string().max(500).optional().allow('', null),
  livenessScore: Joi.number().min(0).max(1).optional()
});

export const breakStartSchema = Joi.object({
  mode: Joi.string()
    .valid('face', 'card', 'finger', 'FACE', 'CARD', 'FINGER')
    .default('face'),
  breakType: Joi.string().valid('LUNCH', 'TEA', 'SHORT', 'PERSONAL', 'TEA_BREAK', 'LUNCH_BREAK', 'SHORT_BREAK').default('SHORT'),
  photo: Joi.string().optional().allow('', null),
  location: locationSchema.optional(),
  deviceInfo: deviceInfoSchema.optional(),
  cardNumber: Joi.string().optional().allow('', null),
  livenessScore: Joi.number().min(0).max(1).optional(),
  remarks: Joi.string().max(255).optional().allow('', null)
});

export const breakEndSchema = Joi.object({
  mode: Joi.string()
    .valid('face', 'card', 'finger', 'FACE', 'CARD', 'FINGER')
    .default('face'),
  photo: Joi.string().optional().allow('', null),
  location: locationSchema.optional(),
  deviceInfo: deviceInfoSchema.optional(),
  cardNumber: Joi.string().optional().allow('', null),
  livenessScore: Joi.number().min(0).max(1).optional(),
  remarks: Joi.string().max(255).optional().allow('', null)
});

export const attendanceLogsSchema = Joi.object({
  employeeId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional(),
  branchId: Joi.string().uuid().optional(),
  status: Joi.string().optional().allow('', null),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  search: Joi.string().optional().allow('', null),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const monthlySummarySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).default(() => new Date().getMonth() + 1),
  year: Joi.number().integer().min(2020).max(2050).default(() => new Date().getFullYear()),
  departmentId: Joi.string().uuid().optional(),
  branchId: Joi.string().uuid().optional(),
  employeeId: Joi.string().uuid().optional()
});

export const cardScanSchema = Joi.object({
  qrData: Joi.string().required(),
  operation: Joi.string().valid('check-in', 'check-out', 'break-start', 'break-end', 'CHECK_IN', 'CHECK_OUT', 'BREAK_START', 'BREAK_END').default('CHECK_IN'),
  breakType: Joi.string().valid('LUNCH', 'TEA', 'SHORT', 'PERSONAL', 'TEA_BREAK', 'LUNCH_BREAK', 'SHORT_BREAK').default('SHORT'),
  location: locationSchema.required(),
  deviceInfo: deviceInfoSchema.optional(),
  remarks: Joi.string().max(500).optional().allow('', null)
});

export const attendanceStatsSchema = Joi.object({
  date: Joi.date().iso().optional()
});

export default {
  checkInSchema,
  checkOutSchema,
  breakStartSchema,
  breakEndSchema,
  cardScanSchema,
  attendanceLogsSchema,
  monthlySummarySchema,
  attendanceStatsSchema
};
