import Joi from 'joi';

export const createShiftSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).required(),
  code: Joi.string().trim().optional().allow(null, ''),
  startTime: Joi.string().trim().required(),
  endTime: Joi.string().trim().required(),
  graceMinutes: Joi.number().integer().min(0).max(120).optional(),
  gracePeriod: Joi.number().integer().min(0).max(120).optional(),
  isNightShift: Joi.boolean().default(false),
  workingHours: Joi.number().min(1).max(24).optional(),
  halfDayHours: Joi.number().min(1).max(24).optional(),
  fullDayHours: Joi.number().min(1).max(24).optional(),
  breakDuration: Joi.number().min(0).max(180).optional(),
  breakRuleIds: Joi.array().items(Joi.string().uuid()).optional().allow(null),
  description: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().default(true)
}).unknown(true);

export const updateShiftSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).optional(),
  code: Joi.string().trim().optional().allow(null, ''),
  startTime: Joi.string().trim().optional(),
  endTime: Joi.string().trim().optional(),
  graceMinutes: Joi.number().integer().min(0).max(120).optional(),
  gracePeriod: Joi.number().integer().min(0).max(120).optional(),
  isNightShift: Joi.boolean().optional(),
  workingHours: Joi.number().min(1).max(24).optional(),
  halfDayHours: Joi.number().min(1).max(24).optional(),
  fullDayHours: Joi.number().min(1).max(24).optional(),
  breakDuration: Joi.number().min(0).max(180).optional(),
  breakRuleIds: Joi.array().items(Joi.string().uuid()).optional().allow(null),
  description: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional()
}).unknown(true);

export const assignShiftSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  employeeIds: Joi.array().items(Joi.string().uuid()).min(1).optional(),
  shiftId: Joi.string().uuid().required(),
  effectiveFrom: Joi.date().iso().default(new Date()),
  effectiveTo: Joi.date().iso().optional().allow(null)
}).unknown(true);
