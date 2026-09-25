import Joi from 'joi';

export const generateRosterSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2020).max(2100).required(),
  shiftId: Joi.string().uuid().optional(),
  shiftPattern: Joi.string().optional(),
  employeeIds: Joi.array().items(Joi.string().uuid()).optional().default([]),
  skipWeekends: Joi.boolean().default(true)
}).unknown(true);

export const bulkAssignRosterSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  employeeIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  shiftId: Joi.string().uuid().required(),
  dates: Joi.array().items(Joi.date().iso()).min(1).required()
}).unknown(true);
