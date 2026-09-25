import designationsService from './designations.service.js';

export const designationsController = {
  async list(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const designations = await designationsService.listDesignations(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { designations } });
    } catch (err) {
      next(err);
    }
  },

  async get(req, res, next) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const designation = await designationsService.getDesignationById(id, companyId);
      if (!designation) return res.status(404).json({ status: 'error', message: 'Designation not found' });
      res.status(200).json({ status: 'ok', data: { designation } });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const designation = await designationsService.createDesignation(companyId, req.body);
      res.status(201).json({ status: 'ok', data: { designation } });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const designation = await designationsService.updateDesignation(id, req.body);
      res.status(200).json({ status: 'ok', data: { designation } });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await designationsService.deleteDesignation(id);
      res.status(200).json({ status: 'ok', message: 'Designation deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async bulkImport(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await designationsService.bulkImportDesignations(companyId, req.body.rows || []);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await designationsService.getDesignationStats(companyId);
      res.status(200).json({ status: 'ok', data: { stats } });
    } catch (err) {
      next(err);
    }
  }
};

export default designationsController;
