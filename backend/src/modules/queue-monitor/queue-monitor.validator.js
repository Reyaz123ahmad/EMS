import Joi from 'joi';

export const queueFiltersSchema = Joi.object({
  queueName: Joi.string().optional(),
  status: Joi.string().valid('waiting', 'active', 'completed', 'failed', 'delayed', 'paused', 'all').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  dateRange: Joi.string().optional(),
}).unknown(true);

export const cleanQueueSchema = Joi.object({
  gracePeriod: Joi.number().integer().min(0).default(1000 * 60 * 60 * 24), // 24 hours
  status: Joi.string().valid('completed', 'failed', 'wait', 'active').default('completed'),
  limit: Joi.number().integer().min(1).max(1000).default(100),
}).unknown(true);
