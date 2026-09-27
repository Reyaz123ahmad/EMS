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
  employeeId: Joi.string().uuid().optional().allow('', null),
  documentTypeId: Joi.string().uuid().optional().allow('', null),
  type: Joi.string().optional().allow('', null),
  title: Joi.string().optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
  issueDate: Joi.string().optional().allow('', null),
  expiryDate: Joi.string().optional().allow('', null),
  fileName: Joi.string().optional().allow('', null),
  fileUrl: Joi.string().optional().allow('', null),
  publicId: Joi.string().optional().allow('', null),
  fileSize: Joi.number().optional().allow('', null),
  mimeType: Joi.string().optional().allow('', null),
  format: Joi.string().optional().allow('', null)
}).unknown(true);

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
