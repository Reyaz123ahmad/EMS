import Joi from 'joi';

export const createHolidayCalendarSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).required(),
  year: Joi.number().integer().min(2020).max(2100).default(new Date().getFullYear()),
  isDefault: Joi.boolean().optional(),
  description: Joi.string().trim().max(500).optional().allow(null, ''),
  isActive: Joi.boolean().default(true)
}).unknown(true);

export const updateHolidayCalendarSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).optional(),
  year: Joi.number().integer().min(2020).max(2100).optional(),
  isDefault: Joi.boolean().optional(),
  description: Joi.string().trim().max(500).optional().allow(null, ''),
  isActive: Joi.boolean().optional()
}).unknown(true);

export const createHolidaySchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  calendarId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).required(),
  date: Joi.date().iso().required(),
  isMandatory: Joi.boolean().default(true),
  isOptional: Joi.boolean().optional(),
  description: Joi.string().trim().max(500).optional().allow(null, '')
}).unknown(true);

export const updateHolidaySchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  calendarId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).optional(),
  date: Joi.date().iso().optional(),
  isMandatory: Joi.boolean().optional(),
  isOptional: Joi.boolean().optional(),
  description: Joi.string().trim().max(500).optional().allow(null, '')
}).unknown(true);

export const bulkImportHolidaysSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  calendarId: Joi.string().uuid().optional(),
  importedBy: Joi.string().uuid().optional(),
  year: Joi.number().integer().min(2020).max(2100).default(new Date().getFullYear()),
  holidays: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().required(),
      date: Joi.date().iso().required(),
      isMandatory: Joi.boolean().optional(),
      isOptional: Joi.boolean().optional(),
      description: Joi.string().optional().allow(null, '')
    }).unknown(true)
  ).min(1).required()
}).unknown(true);

export const assignHolidaysSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  holidayId: Joi.string().uuid().required(),
  employeeIds: Joi.array().items(Joi.string().uuid()).min(1).required()
}).unknown(true);
