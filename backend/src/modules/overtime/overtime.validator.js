import Joi from 'joi';

export const createOvertimeRuleSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).required(),
  multiplier: Joi.number().positive().max(5).default(1.5),
  minMinutes: Joi.number().integer().min(0).max(1440).default(30),
  maxMinutesPerDay: Joi.number().integer().min(0).max(1440).optional().allow(null),
  maxDailyMinutes: Joi.number().integer().min(0).max(1440).optional().allow(null),
  dayType: Joi.string().optional(),
  requiresApproval: Joi.boolean().optional(),
  isActive: Joi.boolean().default(true)
}).unknown(true);

export const updateOvertimeRuleSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).optional(),
  multiplier: Joi.number().positive().max(5).optional(),
  minMinutes: Joi.number().integer().min(0).max(1440).optional(),
  maxMinutesPerDay: Joi.number().integer().min(0).max(1440).optional().allow(null),
  maxDailyMinutes: Joi.number().integer().min(0).max(1440).optional().allow(null),
  dayType: Joi.string().optional(),
  requiresApproval: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
}).unknown(true);

export const applyOvertimeSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  employeeId: Joi.string().uuid().optional(),
  date: Joi.date().iso().required(),
  requestedMinutes: Joi.number().integer().positive().max(1440).optional(),
  minutes: Joi.number().integer().positive().max(1440).optional(),
  reason: Joi.string().trim().max(500).optional().allow(null, '')
}).unknown(true);

export const bulkApproveOvertimeSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  requestIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  approvedBy: Joi.string().uuid().optional()
}).unknown(true);
