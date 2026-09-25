import Joi from 'joi';

export const createRefundRequestSchema = Joi.object({
  paymentId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  reason: Joi.string().required(),
  refundType: Joi.string()
    .valid('CUSTOMER_REQUEST', 'SYSTEM_ISSUE', 'ADMIN_INITIATED', 'DUPLICATE_PAYMENT')
    .default('CUSTOMER_REQUEST'),
  description: Joi.string().allow('', null).optional(),
});

export const approveRefundSchema = Joi.object({
  adminNotes: Joi.string().allow('', null).optional(),
});

export const rejectRefundSchema = Joi.object({
  rejectionReason: Joi.string().required(),
});

export const processRefundSchema = Joi.object({
  speed: Joi.string().valid('normal', 'optimum').default('normal'),
});

export const systemIssueRefundSchema = Joi.object({
  paymentId: Joi.string().required(),
  companyId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().allow('', null).optional(),
  reason: Joi.string().default('SYSTEM_ISSUE'),
});

export const refundFiltersSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'APPROVED', 'PROCESSED', 'REJECTED', 'FAILED').optional(),
  refundType: Joi.string().optional(),
  companyId: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export default {
  createRefundRequestSchema,
  approveRefundSchema,
  rejectRefundSchema,
  processRefundSchema,
  systemIssueRefundSchema,
  refundFiltersSchema,
};
