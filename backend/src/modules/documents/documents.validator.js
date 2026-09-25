import Joi from 'joi';

export const sendAadhaarOTPSchema = Joi.object({
  aadhaarNumber: Joi.string()
    .pattern(/^[\d\s-]{12,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Aadhaar number must be a 12-digit numeric identifier',
      'any.required': 'Aadhaar number is required'
    }),
  name: Joi.string().trim().min(2).max(100).optional().allow(''),
  consent: Joi.boolean().default(true),
  employeeId: Joi.string().uuid().optional()
});

export const verifyAadhaarOTPSchema = Joi.object({
  transactionId: Joi.string().required().messages({
    'any.required': 'Transaction ID is required'
  }),
  otp: Joi.string().pattern(/^\d{6}$/).optional().allow('', null).messages({
    'string.pattern.base': 'OTP must be exactly 6 digits'
  }),
  aadhaarNumber: Joi.string().optional(),
  employeeId: Joi.string().uuid().optional()
});

export const uploadAadhaarSchema = Joi.object({
  transactionId: Joi.string().required().messages({
    'any.required': 'Transaction ID is required'
  }),
  employeeId: Joi.string().uuid().optional(),
  documentTypeId: Joi.string().uuid().optional()
});

export const uploadDocumentSchema = Joi.object({
  documentTypeId: Joi.string().uuid().required(),
  employeeId: Joi.string().uuid().required(),
  fileName: Joi.string().optional(),
  fileUrl: Joi.string().uri().optional(),
  publicId: Joi.string().optional(),
  fileSize: Joi.number().optional(),
  mimeType: Joi.string().optional(),
  format: Joi.string().optional()
});

export const verifyDocumentSchema = Joi.object({
  notes: Joi.string().max(500).optional().allow('')
});

export const rejectDocumentSchema = Joi.object({
  rejectionReason: Joi.string().required().messages({
    'any.required': 'Rejection reason is required'
  })
});

export default {
  sendAadhaarOTPSchema,
  verifyAadhaarOTPSchema,
  uploadAadhaarSchema,
  uploadDocumentSchema,
  verifyDocumentSchema,
  rejectDocumentSchema
};
