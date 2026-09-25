import Joi from 'joi';
import { COMPONENT_TYPES, CALCULATION_TYPES } from './payroll.constants.js';

export const createSalaryComponentSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).required(),
  code: Joi.string().trim().max(20).required(),
  type: Joi.string().valid(...Object.values(COMPONENT_TYPES)).required(),
  calculationType: Joi.string().valid(...Object.values(CALCULATION_TYPES)).default(CALCULATION_TYPES.FIXED),
  defaultAmount: Joi.number().min(0).optional(),
  percentage: Joi.number().min(0).max(100).optional().allow(null),
  isTaxable: Joi.boolean().default(true),
  description: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().default(true)
}).unknown(true);

export const updateSalaryComponentSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).optional(),
  code: Joi.string().trim().max(20).optional(),
  type: Joi.string().valid(...Object.values(COMPONENT_TYPES)).optional(),
  calculationType: Joi.string().valid(...Object.values(CALCULATION_TYPES)).optional(),
  defaultAmount: Joi.number().min(0).optional(),
  percentage: Joi.number().min(0).max(100).optional().allow(null),
  isTaxable: Joi.boolean().optional(),
  description: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional()
}).unknown(true);

export const updateSalaryStructureSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  ctc: Joi.number().positive().required(),
  effectiveFrom: Joi.date().iso().default(new Date()),
  components: Joi.array().items(
    Joi.object({
      componentId: Joi.string().uuid().required(),
      amount: Joi.number().min(0).required()
    })
  ).optional().default([])
}).unknown(true);

export const bulkUpdateStructureSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  employeeIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  ctc: Joi.number().positive().required(),
  components: Joi.array().items(
    Joi.object({
      componentId: Joi.string().uuid().required(),
      amount: Joi.number().min(0).required()
    })
  ).optional().default([])
}).unknown(true);

export const payrollRunSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2020).max(2100).required(),
  processedBy: Joi.string().uuid().optional()
}).unknown(true);
