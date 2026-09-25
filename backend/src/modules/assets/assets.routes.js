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

const router = Router();

router.use(authenticate);

// Special routes (before :id)
router.get('/stats', assetsController.getAssetStats);
router.get('/export', assetsController.exportAssets);
router.get('/categories', assetsController.getAssetCategories);
router.post('/categories', validate(createCategorySchema), assetsController.createAssetCategory);
router.post('/bulk-import', validate(bulkImportAssetsSchema), assetsController.bulkImportAssets);
router.get('/employee/:employeeId', assetsController.getEmployeeAssets);

// CRUD
router.get('/', assetsController.getAssets);
router.post('/', validate(createAssetSchema), assetsController.createAsset);
router.get('/:id', assetsController.getAssetById);
router.put('/:id', validate(updateAssetSchema), assetsController.updateAsset);
router.delete('/:id', assetsController.deleteAsset);

// Actions
router.post('/:id/assign', validate(assignAssetSchema), assetsController.assignAsset);
router.post('/assign', validate(assignAssetSchema), assetsController.assignAsset);
router.post('/:id/return', validate(returnAssetSchema), assetsController.returnAsset);
router.post('/return', validate(returnAssetSchema), assetsController.returnAsset);
router.get('/:id/history', assetsController.getAssetHistory);

export default router;
