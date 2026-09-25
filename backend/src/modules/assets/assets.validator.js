import Joi from 'joi';

export const createAssetSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(2).max(50).required(),
  category: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  purchaseDate: Joi.date().iso().allow(null).optional(),
  purchasePrice: Joi.number().min(0).allow(null).optional(),
  condition: Joi.string().valid('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED').default('GOOD'),
  isActive: Joi.boolean().default(true),
}).unknown(true);

export const updateAssetSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  code: Joi.string().min(2).max(50).optional(),
  category: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  purchaseDate: Joi.date().iso().allow(null).optional(),
  purchasePrice: Joi.number().min(0).allow(null).optional(),
  condition: Joi.string().valid('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED').optional(),
  isActive: Joi.boolean().optional(),
}).unknown(true);

export const assignAssetSchema = Joi.object({
  assetId: Joi.string().uuid().optional(),
  employeeId: Joi.string().uuid().required(),
  condition: Joi.string().default('GOOD'),
  remarks: Joi.string().allow('', null).optional(),
}).unknown(true);

export const returnAssetSchema = Joi.object({
  assetId: Joi.string().uuid().optional(),
  condition: Joi.string().default('GOOD'),
  remarks: Joi.string().allow('', null).optional(),
}).unknown(true);

export const bulkImportAssetsSchema = Joi.object({
  assets: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      code: Joi.string().required(),
      category: Joi.string().allow('', null).optional(),
      purchasePrice: Joi.number().allow(null).optional(),
      condition: Joi.string().optional(),
    }).unknown(true)
  ).min(1).required(),
}).unknown(true);

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow('', null).optional(),
}).unknown(true);
