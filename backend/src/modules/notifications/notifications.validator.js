import Joi from 'joi';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from './notifications.constants.js';

export const createNotificationSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  title: Joi.string().trim().min(2).max(255).required(),
  body: Joi.string().trim().min(1).max(2000).required(),
  type: Joi.string().valid(...Object.values(NOTIFICATION_TYPES)).default(NOTIFICATION_TYPES.SYSTEM),
  priority: Joi.string().valid(...Object.values(NOTIFICATION_PRIORITY)).default(NOTIFICATION_PRIORITY.MEDIUM),
  metadata: Joi.object().optional().allow(null)
});

export const createBulkNotificationSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  title: Joi.string().trim().min(2).max(255).required(),
  body: Joi.string().trim().min(1).max(2000).required(),
  type: Joi.string().valid(...Object.values(NOTIFICATION_TYPES)).default(NOTIFICATION_TYPES.ANNOUNCEMENT),
  priority: Joi.string().valid(...Object.values(NOTIFICATION_PRIORITY)).default(NOTIFICATION_PRIORITY.MEDIUM),
  metadata: Joi.object().optional().allow(null)
});

export const markReadSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export const notificationFiltersSchema = Joi.object({
  type: Joi.string().valid(...Object.values(NOTIFICATION_TYPES)).optional(),
  priority: Joi.string().valid(...Object.values(NOTIFICATION_PRIORITY)).optional(),
  isRead: Joi.boolean().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});
