import Joi from 'joi';

export const createLeaveTypeSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).required(),
  code: Joi.string().trim().max(20).optional().allow(null, ''),
  description: Joi.string().trim().max(500).optional().allow(null, ''),
  maxDaysPerYear: Joi.number().integer().min(1).max(365).optional(),
  daysAllowed: Joi.number().integer().min(1).max(365).optional(),
  isPaid: Joi.boolean().default(true),
  carryForward: Joi.boolean().default(false),
  maxCarryForward: Joi.number().integer().min(0).max(100).optional().allow(null),
  maxCarryForwardDays: Joi.number().integer().min(0).max(100).optional().allow(null)
}).unknown(true);

export const updateLeaveTypeSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(100).optional(),
  code: Joi.string().trim().max(20).optional().allow(null, ''),
  description: Joi.string().trim().max(500).optional().allow(null, ''),
  maxDaysPerYear: Joi.number().integer().min(1).max(365).optional(),
  daysAllowed: Joi.number().integer().min(1).max(365).optional(),
  isPaid: Joi.boolean().optional(),
  carryForward: Joi.boolean().optional(),
  maxCarryForward: Joi.number().integer().min(0).max(100).optional().allow(null),
  maxCarryForwardDays: Joi.number().integer().min(0).max(100).optional().allow(null),
  isActive: Joi.boolean().optional()
}).unknown(true);

export const applyLeaveSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  employeeId: Joi.string().uuid().optional(),
  leaveTypeId: Joi.string().uuid().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  totalDays: Joi.number().positive().max(365).optional(),
  days: Joi.number().positive().max(365).optional(),
  reason: Joi.string().trim().max(1000).optional().allow(null, '')
}).unknown(true);

export const bulkAllocateLeavesSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  employeeIds: Joi.array().items(Joi.string().uuid()).min(1).optional(),
  leaveTypeId: Joi.string().uuid().required(),
  year: Joi.number().integer().min(2020).max(2100).default(new Date().getFullYear()),
  days: Joi.number().positive().max(365).required(),
  allocatedBy: Joi.string().uuid().optional()
}).unknown(true);

export const carryForwardSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  fromYear: Joi.number().integer().min(2020).max(2100).required(),
  toYear: Joi.number().integer().min(2020).max(2100).required()
}).unknown(true);
