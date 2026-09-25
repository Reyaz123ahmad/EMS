import Joi from 'joi';

export const registerFaceSchema = Joi.object({
  employeeId: Joi.string().uuid().required().messages({
    'any.required': 'Employee ID is required for face registration'
  }),
  photo: Joi.string().required().messages({
    'any.required': 'Face photo (Base64 data or image URL) is required'
  }),
  livenessScore: Joi.number().min(0).max(1).optional().default(0.95),
  challengeId: Joi.string().uuid().optional().allow(null, '')
});

export const updateFaceSchema = Joi.object({
  employeeId: Joi.string().uuid().required().messages({
    'any.required': 'Employee ID is required to update face enrollment'
  }),
  photo: Joi.string().required().messages({
    'any.required': 'New face photo is required'
  }),
  livenessScore: Joi.number().min(0).max(1).optional().default(0.95),
  challengeId: Joi.string().uuid().optional().allow(null, '')
});

export const deleteFaceSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  reason: Joi.string().max(500).optional().default('Administrative reset of face biometric')
});

export const verifyFaceSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  photo: Joi.string().required()
});

export const faceFiltersSchema = Joi.object({
  branchId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional(),
  faceRegistered: Joi.boolean().optional(),
  search: Joi.string().allow('').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

export const bulkRegisterSchema = Joi.object({
  employeeIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  defaultPhoto: Joi.string().optional()
});

export default {
  registerFaceSchema,
  updateFaceSchema,
  deleteFaceSchema,
  verifyFaceSchema,
  faceFiltersSchema,
  bulkRegisterSchema
};
