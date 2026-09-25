import reportsService from './reports.service.js';
import { reportFiltersSchema, exportReportSchema } from './reports.validator.js';

export const reportsController = {
  async generateReport(req, res, next) {
    try {
      const { error, value } = reportFiltersSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const companyId = req.user.companyId;
      const { type, filters: nestedFilters, ...flatFilters } = value;
      const combinedFilters = { ...flatFilters, ...(nestedFilters || {}) };
      const report = await reportsService.generateReport(type, companyId, combinedFilters);

      res.status(200).json({ status: 'ok', data: report });
    } catch (err) {
      next(err);
    }
  },

  async exportReport(req, res, next) {
    try {
      const { error, value } = exportReportSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const companyId = req.user.companyId;
      const { type, format, filters: nestedFilters, ...flatFilters } = value;
      const combinedFilters = { ...flatFilters, ...(nestedFilters || {}) };
      const result = await reportsService.exportReport({
        type,
        filters: combinedFilters,
        format,
        companyId,
        userId: req.user.id
      });

      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getReportStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await reportsService.getReportStats(companyId);
      res.status(200).json({ status: 'ok', data: { stats } });
    } catch (err) {
      next(err);
    }
  },

  async getReportHistory(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const history = await reportsService.getReportHistory(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { history } });
    } catch (err) {
      next(err);
    }
  }
};

export default reportsController;
