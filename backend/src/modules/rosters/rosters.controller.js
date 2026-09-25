import rostersService from './rosters.service.js';
import { generateRosterSchema, bulkAssignRosterSchema } from './rosters.validator.js';

export const rostersController = {
  async list(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const rosters = await rostersService.listRosters(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { rosters } });
    } catch (err) {
      next(err);
    }
  },

  async generate(req, res, next) {
    try {
      const { error, value } = generateRosterSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const result = await rostersService.generateRoster({ companyId, ...value });
      res.status(201).json({ status: 'ok', message: 'Roster generated successfully', data: result });
    } catch (err) {
      next(err);
    }
  },

  async publish(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const publishedBy = req.user.id;
      const { rosterId, month, year } = req.body;
      const result = await rostersService.publishRoster({ rosterId, companyId, month, year, publishedBy });
      res.status(200).json({ status: 'ok', message: 'Roster published', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getCalendar(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
      const calendar = await rostersService.getRosterCalendar(companyId, month, year);
      res.status(200).json({ status: 'ok', data: calendar });
    } catch (err) {
      next(err);
    }
  },

  async bulkAssign(req, res, next) {
    try {
      const { error, value } = bulkAssignRosterSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const result = await rostersService.bulkAssignRoster({ ...value, companyId });
      res.status(200).json({ status: 'ok', message: 'Rosters assigned in bulk', data: result });
    } catch (err) {
      next(err);
    }
  }
};

export default rostersController;
