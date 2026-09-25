import Joi from 'joi';

export const createEmergencyAttendanceSchema = Joi.object({
  employeeId: Joi.string().uuid().optional(),
  date: Joi.date().iso().required(),
  checkInTime: Joi.date().iso().allow(null).optional(),
  checkOutTime: Joi.date().iso().allow(null).optional(),
  reason: Joi.string().min(3).max(500).required(),
}).unknown(true);

export const approveEmergencySchema = Joi.object({
  notes: Joi.string().allow('', null).optional(),
}).unknown(true);

export const rejectEmergencySchema = Joi.object({
  reason: Joi.string().min(2).max(255).required(),
}).unknown(true);

export const bulkApproveSchema = Joi.object({
  requestIds: Joi.array().items(Joi.string().uuid().required()).min(1).required(),
}).unknown(true);
