import Joi from 'joi';
import { CARD_TYPES } from './biometric-cards.constants.js';

export const generateCardSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  cardType: Joi.string().valid(...Object.values(CARD_TYPES)).default(CARD_TYPES.QR),
  expiresAt: Joi.date().iso().allow(null, '')
});

export const assignCardSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  cardNumber: Joi.string().trim().min(3).max(50).required(),
  cardType: Joi.string().valid(...Object.values(CARD_TYPES)).default(CARD_TYPES.RFID),
  expiresAt: Joi.date().iso().allow(null, '')
});

export const regenerateQRSchema = Joi.object({
  cardId: Joi.string().uuid().optional()
});

export const deactivateCardSchema = Joi.object({
  cardId: Joi.string().uuid().optional(),
  reason: Joi.string().trim().min(3).max(255).required()
});

export const verifyQRSchema = Joi.object({
  qrData: Joi.string().required()
});

export const cardFiltersSchema = Joi.object({
  employeeId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
  cardType: Joi.string().valid(...Object.values(CARD_TYPES)).optional(),
  search: Joi.string().trim().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});
