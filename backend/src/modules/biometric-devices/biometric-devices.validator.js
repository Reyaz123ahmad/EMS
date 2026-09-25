import Joi from 'joi';
import { DEVICE_TYPES } from './biometric-devices.constants.js';

export const createDeviceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  serialNumber: Joi.string().trim().min(3).max(100).required(),
  deviceType: Joi.string().valid(...Object.values(DEVICE_TYPES)).required(),
  branchId: Joi.string().uuid().optional().allow(null, ''),
  ipAddress: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).optional().allow(null, ''),
  port: Joi.number().integer().min(1).max(65535).optional().allow(null)
});

export const updateDeviceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  branchId: Joi.string().uuid().optional().allow(null, ''),
  ipAddress: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).optional().allow(null, ''),
  port: Joi.number().integer().min(1).max(65535).optional().allow(null),
  isActive: Joi.boolean().optional()
});

export const deviceFiltersSchema = Joi.object({
  branchId: Joi.string().uuid().optional(),
  deviceType: Joi.string().valid(...Object.values(DEVICE_TYPES)).optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().trim().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});
