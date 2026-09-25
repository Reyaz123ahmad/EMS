import branchesService from './branches.service.js';

export const branchesController = {
  async list(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const branches = await branchesService.listBranches(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { branches } });
    } catch (err) {
      next(err);
    }
  },

  async get(req, res, next) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const branch = await branchesService.getBranchById(id, companyId);
      if (!branch) return res.status(404).json({ status: 'error', message: 'Branch not found' });
      res.status(200).json({ status: 'ok', data: { branch } });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const branch = await branchesService.createBranch(companyId, req.body);
      res.status(201).json({ status: 'ok', data: { branch } });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const branch = await branchesService.updateBranch(id, req.body);
      res.status(200).json({ status: 'ok', data: { branch } });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await branchesService.deleteBranch(id);
      res.status(200).json({ status: 'ok', message: 'Branch deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async bulkImport(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await branchesService.bulkImportBranches(companyId, req.body.rows || []);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await branchesService.getBranchStats(companyId);
      res.status(200).json({ status: 'ok', data: { stats } });
    } catch (err) {
      next(err);
    }
  }
};

export default branchesController;
