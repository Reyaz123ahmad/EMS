import Joi from 'joi';
import { PUNCH_TYPES, VERIFICATION_TYPES } from './device-punches.constants.js';

export const devicePunchSchema = Joi.object({
  deviceId: Joi.string().uuid().optional(),
  employeeId: Joi.string().uuid().optional().allow(null, ''),
  cardNumber: Joi.string().trim().optional().allow(null, ''),
  punchType: Joi.string().valid(...Object.values(PUNCH_TYPES)).default(PUNCH_TYPES.AUTO),
  verification: Joi.string().valid(...Object.values(VERIFICATION_TYPES)).default(VERIFICATION_TYPES.FINGERPRINT),
  punchedAt: Joi.date().iso().default(() => new Date().toISOString()),
  rawPayload: Joi.object().optional()
});

export const punchFiltersSchema = Joi.object({
  deviceId: Joi.string().uuid().optional(),
  employeeId: Joi.string().uuid().optional(),
  processed: Joi.boolean().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const punchStatsSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional()
});
