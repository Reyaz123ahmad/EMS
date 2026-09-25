import Joi from 'joi';
import { REPORT_TYPES, EXPORT_FORMATS } from './reports.constants.js';

export const reportFiltersSchema = Joi.object({
  type: Joi.string().valid(...Object.values(REPORT_TYPES)).required(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  departmentId: Joi.string().uuid().optional().allow(null, ''),
  branchId: Joi.string().uuid().optional().allow(null, ''),
  employeeId: Joi.string().uuid().optional().allow(null, ''),
  status: Joi.string().optional().allow(null, ''),
  filters: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    departmentId: Joi.string().uuid().optional().allow(null, ''),
    branchId: Joi.string().uuid().optional().allow(null, ''),
    employeeId: Joi.string().uuid().optional().allow(null, ''),
    status: Joi.string().optional().allow(null, '')
  }).optional().default({})
}).unknown(true);

export const exportReportSchema = Joi.object({
  type: Joi.string().valid(...Object.values(REPORT_TYPES)).required(),
  format: Joi.string().valid(...Object.values(EXPORT_FORMATS)).default(EXPORT_FORMATS.CSV),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  departmentId: Joi.string().uuid().optional().allow(null, ''),
  branchId: Joi.string().uuid().optional().allow(null, ''),
  employeeId: Joi.string().uuid().optional().allow(null, ''),
  status: Joi.string().optional().allow(null, ''),
  filters: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    departmentId: Joi.string().uuid().optional().allow(null, ''),
    branchId: Joi.string().uuid().optional().allow(null, ''),
    employeeId: Joi.string().uuid().optional().allow(null, ''),
    status: Joi.string().optional().allow(null, '')
  }).optional().default({})
}).unknown(true);

