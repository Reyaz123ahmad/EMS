import Joi from 'joi';

export const createWorkflowSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  name: Joi.string().min(2).max(100).required(),
  entityType: Joi.string().valid('LEAVE', 'OVERTIME', 'EXPENSE', 'ATTENDANCE', 'ASSET', 'GENERAL').required(),
  levels: Joi.array().items(
    Joi.object({
      level: Joi.number().integer().min(1).required(),
      role: Joi.string().required(),
      name: Joi.string().optional(),
    })
  ).min(1).required(),
  isActive: Joi.boolean().default(true),
}).unknown(true);

export const createApprovalRequestSchema = Joi.object({
  workflowId: Joi.string().uuid().required(),
  entityType: Joi.string().required(),
  entityId: Joi.string().uuid().required(),
  requestedBy: Joi.string().uuid().required(),
}).unknown(true);

export const actOnRequestSchema = Joi.object({
  action: Joi.string().valid('APPROVE', 'REJECT').required(),
  notes: Joi.string().allow('', null).optional(),
}).unknown(true);
