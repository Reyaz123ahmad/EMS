import leaveService from './leave.service.js';
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  applyLeaveSchema,
  bulkAllocateLeavesSchema,
  carryForwardSchema
} from './leave.validator.js';
import { getAuthEmployeeId, getAuthEmployee, getManagerTeamIds } from '../../security/data-scope.js';

export const leaveController = {
  async listTypes(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const types = await leaveService.listLeaveTypes(companyId);
      res.status(200).json({ status: 'ok', data: { types, total: types.length } });
    } catch (err) {
      next(err);
    }
  },

  async getLeaveTypes(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await leaveService.getLeaveTypes({ companyId });
      res.status(200).json({ status: 'ok', success: true, message: 'Leave types retrieved', data: result });
    } catch (err) {
      next(err);
    }
  },

  async createType(req, res, next) {
    try {
      const { error, value } = createLeaveTypeSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const created = await leaveService.createLeaveType({
        companyId,
        data: value,
        createdBy: req.user.id || req.user.userId
      });
      res.status(201).json({ status: 'ok', message: 'Leave type created', data: created });
    } catch (err) {
      next(err);
    }
  },

  async createLeaveType(req, res, next) {
    try {
      const { error, value } = createLeaveTypeSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const created = await leaveService.createLeaveType({
        companyId,
        data: value,
        createdBy: req.user.id || req.user.userId
      });
      res.status(201).json({ status: 'ok', success: true, message: 'Leave type created', data: created });
    } catch (err) {
      next(err);
    }
  },

  async updateType(req, res, next) {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;

      const { error, value } = updateLeaveTypeSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const allowed = ['name', 'code', 'description', 'maxDaysPerYear', 'daysAllowed', 'isPaid', 'carryForward', 'maxCarryForward', 'maxCarryForwardDays', 'isActive'];
      const cleanData = {};
      for (const key of allowed) {
        if (value[key] !== undefined) {
          cleanData[key] = value[key];
        }
      }

      const updated = await leaveService.updateLeaveType({
        id,
        companyId,
        data: cleanData,
        updatedBy: req.user.id || req.user.userId
      });

      res.status(200).json({ status: 'ok', success: true, message: 'Leave type updated', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async updateLeaveType(req, res, next) {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;

      const { error, value } = updateLeaveTypeSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const allowed = ['name', 'code', 'description', 'maxDaysPerYear', 'daysAllowed', 'isPaid', 'carryForward', 'maxCarryForward', 'maxCarryForwardDays', 'isActive'];
      const cleanData = {};
      for (const key of allowed) {
        if (value[key] !== undefined) {
          cleanData[key] = value[key];
        }
      }

      const updated = await leaveService.updateLeaveType({
        id,
        companyId,
        data: cleanData,
        updatedBy: req.user.id || req.user.userId
      });

      res.status(200).json({ status: 'ok', success: true, message: 'Leave type updated', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteType(req, res, next) {
    try {
      await leaveService.deleteLeaveType(req.params.id);
      res.status(200).json({ status: 'ok', success: true, message: 'Leave type deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async deleteLeaveType(req, res, next) {
    try {
      await leaveService.deleteLeaveType(req.params.id);
      res.status(200).json({ status: 'ok', success: true, message: 'Leave type deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getBalances(req, res, next) {
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

      const balances = await leaveService.getLeaveBalances(companyId, filters);
      res.status(200).json({ status: 'ok', data: { balances } });
    } catch (err) {
      next(err);
    }
  },

  async getEmployeeBalances(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      let employeeId = req.params.employeeId;

      if (role === 'EMPLOYEE' || !employeeId) {
        employeeId = await getAuthEmployeeId(req) || req.user.id;
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        const teamIds = await getManagerTeamIds(emp?.id);
        if (!teamIds.includes(employeeId)) {
          return res.status(403).json({ status: 'error', message: 'Access denied: Employee not in your team' });
        }
      }

      const balances = await leaveService.getEmployeeLeaveBalances(employeeId, req.query.year);
      res.status(200).json({ status: 'ok', data: { balances } });
    } catch (err) {
      next(err);
    }
  },

  async applyLeave(req, res, next) {
    try {
      const { error, value } = applyLeaveSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const role = req.user?.role || 'EMPLOYEE';
      let employeeId = value.employeeId;

      if (role === 'EMPLOYEE' || role === 'MANAGER' || role === 'HR_MANAGER' || !employeeId) {
        employeeId = await getAuthEmployeeId(req) || req.user.id;
      }
      const companyId = req.user.companyId;

      const result = await leaveService.applyLeave({
        ...value,
        employeeId,
        companyId
      });
      res.status(201).json({
        status: 'ok',
        message: 'Leave application submitted successfully',
        data: {
          id: result.leaveRequest?.id,
          ...result.leaveRequest,
          balanceRemaining: result.balanceRemaining
        }
      });

    } catch (err) {
      next(err);
    }
  },

  async getMyRequests(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const empId = await getAuthEmployeeId(req) || req.user.id;
      const result = await leaveService.getMyRequests({
        employeeId: empId,
        companyId,
        filters: req.query,
        pagination: {
          page: parseInt(req.query.page, 10) || 1,
          limit: parseInt(req.query.limit, 10) || 20
        }
      });
      res.status(200).json({
        status: 'ok',
        success: true,
        message: 'My leave requests retrieved',
        data: result.requests,
        requests: result.requests,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      });
    } catch (err) {
      next(err);
    }
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

      const requests = await leaveService.listLeaveRequests(companyId, filters);
      res.status(200).json({ status: 'ok', data: { requests } });
    } catch (err) {
      next(err);
    }
  },

  async approveRequest(req, res, next) {
    try {
      const approvedBy = req.user.id;
      const result = await leaveService.approveLeave({ requestId: req.params.id, approvedBy });
      res.status(200).json({ status: 'ok', message: 'Leave request approved', data: result });
    } catch (err) {
      next(err);
    }
  },

  async rejectRequest(req, res, next) {
    try {
      const approvedBy = req.user.id;
      const { reason } = req.body;
      const result = await leaveService.rejectLeave({ requestId: req.params.id, approvedBy, rejectionReason: reason });
      res.status(200).json({ status: 'ok', message: 'Leave request rejected', data: result });
    } catch (err) {
      next(err);
    }
  },

  async bulkApprove(req, res, next) {
    try {
      const approvedBy = req.user.id;
      const { requestIds } = req.body;
      if (!requestIds || !Array.isArray(requestIds)) {
        return res.status(400).json({ status: 'error', message: 'requestIds array is required' });
      }
      const result = await leaveService.bulkApproveLeave({ requestIds, approvedBy });
      res.status(200).json({ status: 'ok', message: 'Bulk approval completed', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getCalendar(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user.companyId;
      const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
      let employeeId = req.query.employeeId;
      if (role === 'EMPLOYEE') {
        employeeId = await getAuthEmployeeId(req) || req.user.id;
      }
      const calendar = await leaveService.getLeaveCalendar(companyId, month, year, { employeeId });
      res.status(200).json({ status: 'ok', data: calendar });
    } catch (err) {
      next(err);
    }
  },

  async getBalanceReport(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const report = await leaveService.getLeaveBalanceReport(companyId, req.query);
      res.status(200).json({ status: 'ok', data: report });
    } catch (err) {
      next(err);
    }
  },

  async bulkAllocate(req, res, next) {
    try {
      const { error, value } = bulkAllocateLeavesSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const allocatedBy = req.user.id;
      const result = await leaveService.bulkAllocateLeaves({ ...value, allocatedBy, companyId });
      res.status(200).json({ status: 'ok', message: 'Leaves allocated in bulk', data: result });
    } catch (err) {
      next(err);
    }
  },

  async carryForward(req, res, next) {
    try {
      const { error, value } = carryForwardSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const processedBy = req.user.id;
      const result = await leaveService.carryForwardLeaves({ ...value, companyId, processedBy });
      res.status(200).json({ status: 'ok', message: 'Leave carry forward completed', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await leaveService.getLeaveStats(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { stats } });
    } catch (err) {
      next(err);
    }
  },

  async getLeaveHistory(req, res, next) {
    try {
      const employeeId = await getAuthEmployeeId(req) || req.user.employeeId || req.user.id;

      const result = await leaveService.getLeaveHistory({
        employeeId: employeeId,
        companyId: req.user.companyId,
        filters: req.query,
        pagination: {
          page: parseInt(req.query.page, 10) || 1,
          limit: parseInt(req.query.limit, 10) || 20
        }
      });

      res.status(200).json({
        status: 'ok',
        success: true,
        message: 'Leave history retrieved',
        data: result.leaves,
        leaves: result.leaves,
        history: result.leaves,
        requests: result.leaves,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      });
    } catch (err) {
      next(err);
    }
  },

  async getEmployeeHistory(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      let employeeId = req.params.employeeId;
      if (role === 'EMPLOYEE' || !employeeId) {
        employeeId = await getAuthEmployeeId(req) || req.user.employeeId || req.user.id;
      }
      const history = await leaveService.getEmployeeLeaveHistory(employeeId, req.query);
      res.status(200).json({
        status: 'ok',
        success: true,
        data: history,
        history,
        leaves: history,
        requests: history
      });
    } catch (err) {
      next(err);
    }
  }
};

export default leaveController;
