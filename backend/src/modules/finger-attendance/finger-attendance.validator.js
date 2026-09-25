import Joi from 'joi';
import { FINGER_TEMPLATE_FORMATS } from './finger-attendance.constants.js';

export const fingerEnrollSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  fingerIndex: Joi.number().integer().min(0).max(9).required().messages({
    'any.required': 'Finger index (0-9) is required'
  }),
  template: Joi.string().required().messages({
    'any.required': 'Biometric fingerprint template data is required'
  }),
  templateFormat: Joi.string().valid(...Object.values(FINGER_TEMPLATE_FORMATS)).default('ISO'),
  deviceId: Joi.string().uuid().optional().allow(null, '')
});

export const fingerDevicePunchSchema = Joi.object({
  deviceId: Joi.string().uuid().optional(),
  employeeId: Joi.string().uuid().optional(),
  fingerIndex: Joi.number().integer().min(0).max(9).optional(),
  punchType: Joi.string().valid('CHECK_IN', 'CHECK_OUT', 'BREAK_START', 'BREAK_END', 'AUTO').default('AUTO'),
  verification: Joi.string().default('FINGERPRINT'),
  rawPayload: Joi.object().optional(),
  punchedAt: Joi.date().iso().optional()
});

export const fingerFiltersSchema = Joi.object({
  branchId: Joi.string().uuid().optional(),
  deviceId: Joi.string().uuid().optional(),
  employeeId: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

export const deleteEnrollmentSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  fingerIndex: Joi.number().integer().min(0).max(9).required()
});

export default {
  fingerEnrollSchema,
  fingerDevicePunchSchema,
  fingerFiltersSchema,
  deleteEnrollmentSchema
};
