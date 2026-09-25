import overtimeService from './overtime.service.js';
import {
  createOvertimeRuleSchema,
  updateOvertimeRuleSchema,
  applyOvertimeSchema,
  bulkApproveOvertimeSchema
} from './overtime.validator.js';

export const overtimeController = {
  async listRules(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const rules = await overtimeService.listRules(companyId);
      res.status(200).json({ status: 'ok', data: { rules } });
    } catch (err) {
      next(err);
    }
  },

  async createRule(req, res, next) {
    try {
      const { error, value } = createOvertimeRuleSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const created = await overtimeService.createRule(companyId, value);
      res.status(201).json({ status: 'ok', message: 'Overtime rule created', data: created });
    } catch (err) {
      next(err);
    }
  },

  async updateRule(req, res, next) {
    try {
      const { error, value } = updateOvertimeRuleSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const updated = await overtimeService.updateRule(req.params.id, value);
      res.status(200).json({ status: 'ok', message: 'Overtime rule updated', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteRule(req, res, next) {
    try {
      await overtimeService.deleteRule(req.params.id);
      res.status(200).json({ status: 'ok', message: 'Overtime rule deleted' });
    } catch (err) {
      next(err);
    }
  },

  async listRecords(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const records = await overtimeService.listRecords(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { records } });
    } catch (err) {
      next(err);
    }
  },

  async calculate(req, res, next) {
    try {
      const { employeeId, date, minutes } = req.body;
      if (!employeeId || minutes === undefined) {
        return res.status(400).json({ status: 'error', message: 'employeeId and minutes are required' });
      }
      const result = await overtimeService.calculateOvertime({
        employeeId,
        date: date || new Date(),
        minutes: parseInt(minutes, 10)
      });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  async apply(req, res, next) {
    try {
      const { error, value } = applyOvertimeSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const employeeId = req.body.employeeId || req.user.employee?.id || req.user.id;
      const companyId = req.user.companyId;
      const request = await overtimeService.applyOvertime({ ...value, employeeId, companyId });
      res.status(201).json({ status: 'ok', message: 'Overtime request submitted', data: request });
    } catch (err) {
      next(err);
    }
  },

  async listRequests(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const requests = await overtimeService.listRequests(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { requests } });
    } catch (err) {
      next(err);
    }
  },

  async approveRequest(req, res, next) {
    try {
      const approvedBy = req.user.id;
      const approved = await overtimeService.approveRequest({ requestId: req.params.id, approvedBy });
      res.status(200).json({ status: 'ok', message: 'Overtime request approved', data: approved });
    } catch (err) {
      next(err);
    }
  },

  async rejectRequest(req, res, next) {
    try {
      const approvedBy = req.user.id;
      const rejected = await overtimeService.rejectRequest({ requestId: req.params.id, approvedBy });
      res.status(200).json({ status: 'ok', message: 'Overtime request rejected', data: rejected });
    } catch (err) {
      next(err);
    }
  },

  async bulkApprove(req, res, next) {
    try {
      const { error, value } = bulkApproveOvertimeSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const approvedBy = req.user.id;
      const result = await overtimeService.bulkApproveOvertime({ ...value, approvedBy });
      res.status(200).json({ status: 'ok', message: 'Bulk approval processed', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await overtimeService.getOvertimeStats(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { stats } });
    } catch (err) {
      next(err);
    }
  },

  async getReport(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const report = await overtimeService.getOvertimeReport(companyId, req.query);
      res.status(200).json({ status: 'ok', data: report });
    } catch (err) {
      next(err);
    }
  }
};

export default overtimeController;
