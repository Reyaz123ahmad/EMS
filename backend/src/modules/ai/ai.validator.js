import Joi from 'joi';

export const chatSchema = Joi.object({
  message: Joi.string().trim().min(1).max(2000).required(),
  sessionId: Joi.string().optional(),
  context: Joi.object().optional()
});

export const insightParamSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  employeeId: Joi.string().uuid().optional()
});

export const periodQuerySchema = Joi.object({
  period: Joi.string().trim().max(50).default('current'),
  forceRefresh: Joi.boolean().default(false)
});

export const anomalyQuerySchema = Joi.object({
  dataType: Joi.string().trim().default('ATTENDANCE_AND_PAYROLL')
});

export const reportGenSchema = Joi.object({
  reportType: Joi.string().trim().required(),
  filters: Joi.object().optional()
});

export default {
  chatSchema,
  insightParamSchema,
  periodQuerySchema,
  anomalyQuerySchema,
  reportGenSchema
};
