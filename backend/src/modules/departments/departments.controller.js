import departmentsService from './departments.service.js';

export const departmentsController = {
  async list(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const departments = await departmentsService.listDepartments(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { departments } });
    } catch (err) {
      next(err);
    }
  },

  async get(req, res, next) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const department = await departmentsService.getDepartmentById(id, companyId);
      if (!department) return res.status(404).json({ status: 'error', message: 'Department not found' });
      res.status(200).json({ status: 'ok', data: { department } });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const department = await departmentsService.createDepartment(companyId, req.body);
      res.status(201).json({ status: 'ok', data: { department } });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const department = await departmentsService.updateDepartment(id, req.body);
      res.status(200).json({ status: 'ok', data: { department } });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await departmentsService.deleteDepartment(id);
      res.status(200).json({ status: 'ok', message: 'Department deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async bulkImport(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await departmentsService.bulkImportDepartments(companyId, req.body.rows || []);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await departmentsService.getDepartmentStats(companyId);
      res.status(200).json({ status: 'ok', data: { stats } });
    } catch (err) {
      next(err);
    }
  }
};

export default departmentsController;
