import Joi from 'joi';
import { FRAUD_TYPES, SEVERITY, LIVENESS_CHALLENGE_TYPES } from './attendance-security.constants.js';

export const livenessChallengeSchema = Joi.object({
  employeeId: Joi.string().uuid().optional(),
  challengeType: Joi.string()
    .valid(...Object.values(LIVENESS_CHALLENGE_TYPES))
    .optional()
});

export const livenessVerifySchema = Joi.object({
  employeeId: Joi.string().uuid().optional(),
  challengeId: Joi.string().uuid().required(),
  livenessScore: Joi.number().min(0).max(1).required(),
  imageData: Joi.string().optional().allow('', null),
  metadata: Joi.object().optional()
});

export const fraudSignalSchema = Joi.object({
  employeeId: Joi.string().uuid().optional().allow(null),
  signalType: Joi.string()
    .valid(...Object.values(FRAUD_TYPES))
    .required(),
  severity: Joi.string()
    .valid(...Object.values(SEVERITY))
    .default(SEVERITY.MEDIUM),
  description: Joi.string().optional().allow('', null),
  employeeLat: Joi.number().optional().allow(null),
  employeeLng: Joi.number().optional().allow(null),
  expectedLat: Joi.number().optional().allow(null),
  expectedLng: Joi.number().optional().allow(null),
  distanceMeters: Joi.number().optional().allow(null),
  metadata: Joi.object().optional()
});

export const reviewFraudSignalSchema = Joi.object({
  notes: Joi.string().optional().allow('', null),
  reviewNotes: Joi.string().optional().allow('', null),
  actionTaken: Joi.string().valid('DISMISSED', 'FLAGGED', 'PENALIZED', 'RESOLVED').default('RESOLVED'),
  status: Joi.string().valid('DISMISSED', 'FLAGGED', 'PENALIZED', 'RESOLVED').default('RESOLVED')
});

export const fraudQuerySchema = Joi.object({
  employeeId: Joi.string().uuid().optional(),
  signalType: Joi.string().optional(),
  severity: Joi.string().optional(),
  reviewed: Joi.boolean().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export default {
  livenessChallengeSchema,
  livenessVerifySchema,
  fraudSignalSchema,
  reviewFraudSignalSchema,
  fraudQuerySchema
};
