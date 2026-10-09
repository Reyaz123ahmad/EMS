import Joi from 'joi';

export const createBreakRuleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Break rule name is required',
    'string.min': 'Break rule name must be at least 2 characters',
    'string.max': 'Break rule name must be at most 50 characters',
  }),
  durationMinutes: Joi.number().integer().min(5).max(120).required().messages({
    'number.base': 'Duration must be a number',
    'number.min': 'Duration must be at least 5 minutes',
    'number.max': 'Duration cannot exceed 120 minutes',
  }),
  maxPerShift: Joi.number().integer().min(1).max(10).default(1).messages({
    'number.base': 'Max per shift must be a number',
    'number.min': 'Max per shift must be at least 1',
    'number.max': 'Max per shift cannot exceed 10',
  }),
  isPaid: Joi.boolean().default(true),
  isActive: Joi.boolean().default(true),
});

export const updateBreakRuleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  durationMinutes: Joi.number().integer().min(5).max(120).optional(),
  maxPerShift: Joi.number().integer().min(1).max(10).optional(),
  isPaid: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);
