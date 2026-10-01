import { Router } from 'express';
import { assetsController } from './assets.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createAssetSchema,
  updateAssetSchema,
  assignAssetSchema,
  returnAssetSchema,
  bulkImportAssetsSchema,
  createCategorySchema,
} from './assets.validator.js';

import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);

// Special routes (before :id)
router.get('/my', cacheResponse('cache:assets_my', 60), assetsController.getMyAssets);
router.get('/stats', cacheResponse('cache:assets_stats', 60), assetsController.getAssetStats);
router.get('/export', cacheResponse('cache:assets_export', 60), assetsController.exportAssets);
router.get('/categories', cacheResponse('cache:assets_categories', 60), assetsController.getAssetCategories);
router.post('/categories', validate(createCategorySchema), assetsController.createAssetCategory);
router.post('/bulk-import', validate(bulkImportAssetsSchema), assetsController.bulkImportAssets);
router.get('/employee/:employeeId', cacheResponse('cache:assets_employee', 60), assetsController.getEmployeeAssets);

// CRUD
router.get('/', cacheResponse('cache:assets_list', 60), assetsController.getAssets);
router.post('/', validate(createAssetSchema), assetsController.createAsset);
router.get('/:id', cacheResponse('cache:assets_detail', 60), assetsController.getAssetById);
router.put('/:id', validate(updateAssetSchema), assetsController.updateAsset);
router.delete('/:id', assetsController.deleteAsset);

// Actions
router.post('/:id/assign', validate(assignAssetSchema), assetsController.assignAsset);
router.post('/assign', validate(assignAssetSchema), assetsController.assignAsset);
router.post('/:id/return', validate(returnAssetSchema), assetsController.returnAsset);
router.post('/return', validate(returnAssetSchema), assetsController.returnAsset);
router.get('/:id/history', cacheResponse('cache:assets_history', 60), assetsController.getAssetHistory);

export default router;
