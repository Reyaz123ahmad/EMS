import Joi from 'joi';

export const createCouponSchema = Joi.object({
  code: Joi.string().uppercase().trim().min(3).max(30).required(),
  discountType: Joi.string().valid('PERCENTAGE', 'FIXED').default('PERCENTAGE'),
  discountValue: Joi.number().positive().required(),
  validFrom: Joi.date().iso().default(() => new Date()),
  validTo: Joi.date().iso().required(),
  maxUses: Joi.number().integer().positive().default(100),
  planIds: Joi.array().items(Joi.string()).allow(null).optional(),
});

export const updateCouponSchema = Joi.object({
  discountType: Joi.string().valid('PERCENTAGE', 'FIXED').optional(),
  discountValue: Joi.number().positive().optional(),
  validTo: Joi.date().iso().optional(),
  maxUses: Joi.number().integer().positive().optional(),
  isActive: Joi.boolean().optional(),
  planIds: Joi.array().items(Joi.string()).allow(null).optional(),
});

export const validateCouponSchema = Joi.object({
  code: Joi.string().required(),
  planId: Joi.string().required(),
  companyId: Joi.string().optional(),
});

export const applyCouponSchema = Joi.object({
  code: Joi.string().required(),
  planId: Joi.string().required(),
  companyId: Joi.string().optional(),
  paymentId: Joi.string().optional(),
});

export default {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  applyCouponSchema,
};
