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
  description: Joi.string().allow('', null).optional(),
  price: Joi.number().min(0).required(),
  billingCycle: Joi.string().valid('monthly', 'yearly').default('monthly'),
  features: Joi.object().optional().default({}),
  maxEmployees: Joi.number().integer().default(50),
  maxBranches: Joi.number().integer().default(1),
  maxDevices: Joi.number().integer().default(1),
  maxStorageGB: Joi.number().integer().default(5),
  securityLevel: Joi.string().valid('basic', 'standard', 'high').default('basic'),
  isActive: Joi.boolean().default(true),
}).unknown(true);
