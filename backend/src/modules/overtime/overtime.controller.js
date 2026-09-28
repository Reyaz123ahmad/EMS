import overtimeService from './overtime.service.js';
import {
  createOvertimeRuleSchema,
  updateOvertimeRuleSchema,
  applyOvertimeSchema,
  bulkApproveOvertimeSchema
} from './overtime.validator.js';
import { getAuthEmployeeId, getAuthEmployee, getManagerTeamIds } from '../../security/data-scope.js';

export const overtimeController = {
  async listRules(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await overtimeService.getOvertimeRules({ companyId });
      res.status(200).json({ status: 'ok', success: true, data: result.rules, rules: result.rules, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async getOvertimeRules(req, res, next) {
    return overtimeController.listRules(req, res, next);
  },

  async createRule(req, res, next) {
    try {
      const { error, value } = createOvertimeRuleSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', success: false, message: error.details[0].message });

      const companyId = req.user.companyId;
      const createdBy = req.user.userId || req.user.id;
      const created = await overtimeService.createOvertimeRule({ companyId, data: value, createdBy });
      res.status(201).json({ status: 'ok', success: true, message: 'Overtime rule created', data: created });
    } catch (err) {
      next(err);
    }
  },

  async createOvertimeRule(req, res, next) {
    return overtimeController.createRule(req, res, next);
  },

  async updateRule(req, res, next) {
    try {
      const { error, value } = updateOvertimeRuleSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', success: false, message: error.details[0].message });

      const updated = await overtimeService.updateRule(req.params.id, value);
      res.status(200).json({ status: 'ok', success: true, message: 'Overtime rule updated', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteRule(req, res, next) {
    try {
      await overtimeService.deleteOvertimeRule(req.params.id);
      res.status(200).json({ status: 'ok', success: true, message: 'Overtime rule deleted' });
    } catch (err) {
      next(err);
    }
  },

  async deleteOvertimeRule(req, res, next) {
    return overtimeController.deleteRule(req, res, next);
  },

  async listRecords(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user.companyId;
      const filters = {
        employeeId: req.query.employeeId,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      if (role === 'EMPLOYEE') {
        filters.employeeId = await getAuthEmployeeId(req);
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        filters.employeeIds = await getManagerTeamIds(emp?.id);
      } else if (role === 'HR_MANAGER') {
        const emp = await getAuthEmployee(req);
        if (emp?.departmentId) filters.departmentId = emp.departmentId;
      }

      const result = await overtimeService.listOvertimeRecords({
        companyId,
        filters,
        pagination: {
          page: parseInt(req.query.page, 10) || 1,
          limit: parseInt(req.query.limit, 10) || 20
        }
      });
      res.status(200).json({ status: 'ok', success: true, message: 'Overtime records retrieved', data: result.records, records: result.records, total: result.total, page: result.page, totalPages: result.totalPages });
    } catch (err) {
      next(err);
    }
  },

  async listOvertimeRecords(req, res, next) {
    return overtimeController.listRecords(req, res, next);
  },

  async calculate(req, res, next) {
    try {
      const { employeeId, date, minutes } = req.body;
      if (!employeeId || minutes === undefined) {
        return res.status(400).json({ status: 'error', success: false, message: 'employeeId and minutes are required' });
      }
      const result = await overtimeService.calculateOvertime({
        employeeId,
        date: date || new Date(),
        minutes: parseInt(minutes, 10)
      });
      res.status(200).json({ status: 'ok', success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async apply(req, res, next) {
    try {
      const { error, value } = applyOvertimeSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', success: false, message: error.details[0].message });

      const userId = req.user.userId || req.user.id;
      const companyId = req.user.companyId;

      console.log('Overtime apply request:', { userId, companyId, body: req.body });

      if (!userId) {
        return res.status(401).json({ status: 'error', success: false, message: 'User not authenticated' });
      }

      if (!companyId) {
        return res.status(400).json({ status: 'error', success: false, message: 'Company not found. Please login again.' });
      }

      const request = await overtimeService.applyOvertime({
        userId,
        companyId,
        data: value
      });

      res.status(201).json({ status: 'ok', success: true, message: 'Overtime request submitted', data: request });
    } catch (err) {
      console.error('Overtime apply error:', err);
      next(err);
    }
  },

  async applyOvertime(req, res, next) {
    return overtimeController.apply(req, res, next);
  },

  async listRequests(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user.companyId;
      const filters = { ...req.query };

      if (role === 'EMPLOYEE') {
        filters.employeeId = await getAuthEmployeeId(req);
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        filters.employeeIds = await getManagerTeamIds(emp?.id);
      } else if (role === 'HR_MANAGER') {
        const emp = await getAuthEmployee(req);
        if (emp?.departmentId) filters.departmentId = emp.departmentId;
      }

      const requests = await overtimeService.listRequests(companyId, filters);
      res.status(200).json({ status: 'ok', success: true, data: { requests }, requests });
    } catch (err) {
      next(err);
    }
  },

  async approveRequest(req, res, next) {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      const approvedBy = req.user.userId || req.user.id;

      const approved = await overtimeService.approveOvertime({ requestId: id, companyId, approvedBy });
      res.status(200).json({ status: 'ok', success: true, message: 'Overtime request approved', data: approved });
    } catch (err) {
      next(err);
    }
  },

  async approveOvertime(req, res, next) {
    return overtimeController.approveRequest(req, res, next);
  },

  async rejectRequest(req, res, next) {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      const rejectedBy = req.user.userId || req.user.id;
      const { reason } = req.body || {};

      console.log('Reject overtime:', { id, companyId, rejectedBy });

      if (!id) {
        return res.status(400).json({ status: 'error', success: false, message: 'Request ID is required' });
      }

      const rejected = await overtimeService.rejectOvertime({
        requestId: id,
        companyId,
        rejectedBy,
        reason
      });
      res.status(200).json({ status: 'ok', success: true, message: 'Overtime request rejected', data: rejected });
    } catch (err) {
      console.error('Reject overtime error:', err);
      next(err);
    }
  },

  async rejectOvertime(req, res, next) {
    return overtimeController.rejectRequest(req, res, next);
  },

  async bulkApprove(req, res, next) {
    try {
      const { error, value } = bulkApproveOvertimeSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', success: false, message: error.details[0].message });

      const approvedBy = req.user.id;
      const result = await overtimeService.bulkApproveOvertime({ ...value, approvedBy });
      res.status(200).json({ status: 'ok', success: true, message: 'Bulk approval processed', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await overtimeService.getOvertimeStats({ companyId });
      res.status(200).json({ status: 'ok', success: true, message: 'Overtime stats retrieved', data: stats, stats });
    } catch (err) {
      next(err);
    }
  },

  async getOvertimeStats(req, res, next) {
    return overtimeController.getStats(req, res, next);
  },

  async getReport(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const report = await overtimeService.getOvertimeReport(companyId, req.query);
      res.status(200).json({ status: 'ok', success: true, data: report });
    } catch (err) {
      next(err);
    }
  }
};

export default overtimeController;
