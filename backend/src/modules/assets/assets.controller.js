import { assetsService } from './assets.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const assetsController = {
  async getAssets(req, res) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const assets = await assetsService.getAssets(companyId, req.query);
      return sendSuccess(res, assets, 'Assets retrieved successfully');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getAssetById(req, res) {
    try {
      const asset = await assetsService.getAssetById(req.params.id);
      if (!asset) {
        return sendError(res, 'Asset not found', 404);
      }
      return sendSuccess(res, asset, 'Asset details retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async createAsset(req, res) {
    try {
      const companyId = req.user?.companyId || req.body.companyId;
      const asset = await assetsService.createAsset({
        ...req.body,
        companyId,
      });
      return sendSuccess(res, asset, 'Asset created successfully', 201);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async updateAsset(req, res) {
    try {
      const asset = await assetsService.updateAsset(req.params.id, req.body);
      return sendSuccess(res, asset, 'Asset updated successfully');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async deleteAsset(req, res) {
    try {
      await assetsService.deleteAsset(req.params.id);
      return sendSuccess(res, null, 'Asset deleted successfully');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async assignAsset(req, res) {
    try {
      const assetId = req.params.id || req.body.assetId;
      const assignedBy = req.user?.id;
      const assignment = await assetsService.assignAsset({
        ...req.body,
        assetId,
        assignedBy,
      });
      return sendSuccess(res, assignment, 'Asset assigned successfully', 201);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async returnAsset(req, res) {
    try {
      const assetId = req.params.id || req.body.assetId;
      const returnedBy = req.user?.id;
      const assignment = await assetsService.returnAsset({
        ...req.body,
        assetId,
        returnedBy,
      });
      return sendSuccess(res, assignment, 'Asset returned successfully');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getAssetHistory(req, res) {
    try {
      const history = await assetsService.getAssetHistory(req.params.id);
      return sendSuccess(res, history, 'Asset history retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getEmployeeAssets(req, res) {
    try {
      const employeeId = req.params.employeeId || req.user?.employee?.id;
      const assets = await assetsService.getEmployeeAssets(employeeId);
      return sendSuccess(res, assets, 'Employee assets retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getAssetStats(req, res) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const stats = await assetsService.getAssetStats(companyId);
      return sendSuccess(res, stats, 'Asset stats retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async bulkImportAssets(req, res) {
    try {
      const companyId = req.user?.companyId || req.body.companyId;
      const imported = await assetsService.bulkImportAssets({
        assets: req.body.assets,
        companyId,
      });
      return sendSuccess(res, imported, `${imported.length} assets imported successfully`, 201);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async exportAssets(req, res) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const data = await assetsService.exportAssets(companyId, req.query);
      return sendSuccess(res, data, 'Assets exported');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getAssetCategories(req, res) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const categories = await assetsService.getAssetCategories(companyId);
      return sendSuccess(res, categories, 'Asset categories retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async createAssetCategory(req, res) {
    try {
      const companyId = req.user?.companyId || req.body.companyId;
      const category = await assetsService.createAssetCategory(companyId, req.body);
      return sendSuccess(res, category, 'Asset category created', 201);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },
};
