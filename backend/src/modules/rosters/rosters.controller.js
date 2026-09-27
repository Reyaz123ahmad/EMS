import rostersService from './rosters.service.js';

export const rostersController = {
  async list(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await rostersService.listRosters({
        companyId,
        filters: {
          month: req.query.month ? parseInt(req.query.month, 10) : null,
          year: req.query.year ? parseInt(req.query.year, 10) : null,
          employeeId: req.query.employeeId,
          shiftId: req.query.shiftId
        },
        pagination: {
          page: parseInt(req.query.page, 10) || 1,
          limit: Math.min(parseInt(req.query.limit, 10) || 100, 500)
        }
      });
      res.status(200).json({
        status: 'ok',
        success: true,
        message: 'Rosters retrieved',
        data: result.rosters,
        rosters: result.rosters,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      });
    } catch (err) {
      next(err);
    }
  },

  async listRosters(req, res, next) {
    return rostersController.list(req, res, next);
  },

  async generate(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const createdBy = req.user.userId || req.user.id;
      const result = await rostersService.generateRoster({
        companyId,
        data: req.body,
        createdBy
      });
      res.status(201).json({ status: 'ok', success: true, message: 'Roster generated successfully', data: result });
    } catch (err) {
      next(err);
    }
  },

  async generateRoster(req, res, next) {
    return rostersController.generate(req, res, next);
  },

  async update(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updatedBy = req.user.userId || req.user.id;
      const result = await rostersService.updateRoster({
        id: req.params.id,
        companyId,
        data: req.body,
        updatedBy
      });
      res.status(200).json({ status: 'ok', success: true, message: 'Roster updated', data: result });
    } catch (err) {
      next(err);
    }
  },

  async updateRoster(req, res, next) {
    return rostersController.update(req, res, next);
  },

  async delete(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deletedBy = req.user.userId || req.user.id;
      const result = await rostersService.deleteRoster({
        id: req.params.id,
        companyId,
        deletedBy
      });
      res.status(200).json({ status: 'ok', success: true, message: 'Roster deleted', data: result });
    } catch (err) {
      next(err);
    }
  },

  async deleteRoster(req, res, next) {
    return rostersController.delete(req, res, next);
  },

  async publish(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const publishedBy = req.user.userId || req.user.id;
      const id = req.params.id || req.body.id || req.body.rosterId;
      const { month, year } = req.body;
      const result = await rostersService.publishRoster({
        id,
        rosterId: id,
        companyId,
        month,
        year,
        publishedBy
      });
      res.status(200).json({ status: 'ok', success: true, message: 'Roster published', data: result });
    } catch (err) {
      next(err);
    }
  },

  async publishRoster(req, res, next) {
    return rostersController.publish(req, res, next);
  },

  async getCalendar(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { month = new Date().getMonth() + 1, year = new Date().getFullYear(), employeeId } = req.query;
      const calendar = await rostersService.getRosterCalendar({
        companyId,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        employeeId
      });
      res.status(200).json({
        status: 'ok',
        success: true,
        data: calendar,
        roster: calendar.rosters,
        rosters: calendar.rosters
      });
    } catch (err) {
      next(err);
    }
  },

  async getRosterCalendar(req, res, next) {
    return rostersController.getCalendar(req, res, next);
  },

  async bulkAssign(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await rostersService.bulkAssignRoster({ ...req.body, companyId });
      res.status(200).json({ status: 'ok', success: true, message: 'Rosters assigned in bulk', data: result });
    } catch (err) {
      next(err);
    }
  }
};

export default rostersController;
