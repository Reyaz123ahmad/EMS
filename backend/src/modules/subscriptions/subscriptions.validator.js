import Joi from 'joi';

export const createOrderSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  planId: Joi.string().uuid().required(),
  billingCycle: Joi.string().valid('monthly', 'yearly').default('monthly'),
}).unknown(true);

export const verifyPaymentSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  planId: Joi.string().uuid().optional(),
  razorpayOrderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required(),
}).unknown(true);

export const renewSubscriptionSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  planId: Joi.string().uuid().optional(),
  billingCycle: Joi.string().valid('monthly', 'yearly').default('monthly'),
}).unknown(true);

export const cancelSubscriptionSchema = Joi.object({
  companyId: Joi.string().uuid().optional(),
  reason: Joi.string().min(3).max(500).required(),
}).unknown(true);

export const planSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().lowercase().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  price: Joi.number().min(0).optional(),
  priceMonthly: Joi.number().min(0).optional(),
  priceYearly: Joi.number().min(0).allow(null).optional(),
  billingCycle: Joi.string().valid('monthly', 'yearly').default('monthly'),
  features: Joi.alternatives().try(
    Joi.array().items(Joi.string().max(200)),
    Joi.object()
  ).default([]),
  maxEmployees: Joi.number().integer().allow(null).optional(),
  maxBranches: Joi.number().integer().allow(null).optional(),
  maxDevices: Joi.number().integer().allow(null).optional(),
  maxStorageGB: Joi.number().integer().allow(null).optional(),
  securityLevel: Joi.string().valid('basic', 'standard', 'high').default('basic'),
  isActive: Joi.boolean().default(true),
  displayOrder: Joi.number().integer().allow(null).optional(),
}).unknown(true);
