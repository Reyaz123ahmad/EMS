import Joi from 'joi';
import { ATTESTATION_PROVIDERS, SECURITY_LEVELS } from './advanced-security.constants.js';

export const deviceAttestationSchema = Joi.object({
  deviceId: Joi.string().required().messages({
    'any.required': 'Device ID is required for hardware attestation'
  }),
  attestationToken: Joi.string().required().messages({
    'any.required': 'Cryptographic attestation token is required'
  }),
  platform: Joi.string().valid('android', 'ios', 'web').default('android'),
  provider: Joi.string().valid(...Object.values(ATTESTATION_PROVIDERS)).default('PLAY_INTEGRITY'),
  isRooted: Joi.boolean().default(false),
  isEmulator: Joi.boolean().default(false),
  metadata: Joi.object().optional()
});

export const ipWhitelistSchema = Joi.object({
  enabled: Joi.boolean().required(),
  allowedRanges: Joi.array().items(Joi.string()).min(1).required()
});

export const securitySettingsSchema = Joi.object({
  securityLevel: Joi.string().valid(...Object.values(SECURITY_LEVELS)).optional(),
  ipWhitelistEnabled: Joi.boolean().optional(),
  allowedIpRanges: Joi.array().items(Joi.string()).optional(),
  requireDeviceAttestation: Joi.boolean().optional(),
  blockRootedDevices: Joi.boolean().optional(),
  blockEmulators: Joi.boolean().optional(),
  blockVpn: Joi.boolean().optional(),
  maxFailedAttempts: Joi.number().integer().min(1).max(20).optional(),
  fraudThresholdScore: Joi.number().min(0).max(100).optional()
});

export const fraudReviewSchema = Joi.object({
  action: Joi.string().valid('APPROVE', 'REJECT', 'BLOCK', 'RESOLVE').required(),
  notes: Joi.string().max(1000).optional().allow('')
});

export const validateIpSchema = Joi.object({
  ipAddress: Joi.string().required()
});

export const detectVpnSchema = Joi.object({
  ipAddress: Joi.string().required()
});

export default {
  deviceAttestationSchema,
  ipWhitelistSchema,
  securitySettingsSchema,
  fraudReviewSchema,
  validateIpSchema,
  detectVpnSchema
};
