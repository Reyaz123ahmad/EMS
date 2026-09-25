import leaveService from './leave.service.js';
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  applyLeaveSchema,
  bulkAllocateLeavesSchema,
  carryForwardSchema
} from './leave.validator.js';

export const leaveController = {
  async listTypes(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const types = await leaveService.listLeaveTypes(companyId);
      res.status(200).json({ status: 'ok', data: { types } });
    } catch (err) {
      next(err);
    }
  },

  async createType(req, res, next) {
    try {
      const { error, value } = createLeaveTypeSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const created = await leaveService.createLeaveType(companyId, value);
      res.status(201).json({ status: 'ok', message: 'Leave type created', data: created });
    } catch (err) {
      next(err);
    }
  },

  async updateType(req, res, next) {
    try {
      const { error, value } = updateLeaveTypeSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const updated = await leaveService.updateLeaveType(req.params.id, value);
      res.status(200).json({ status: 'ok', message: 'Leave type updated', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteType(req, res, next) {
    try {
      await leaveService.deleteLeaveType(req.params.id);
      res.status(200).json({ status: 'ok', message: 'Leave type deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getBalances(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const balances = await leaveService.getLeaveBalances(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { balances } });
    } catch (err) {
      next(err);
    }
  },

  async getEmployeeBalances(req, res, next) {
    try {
      const employeeId = req.params.employeeId || req.user.employee?.id || req.user.id;
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

      const employeeId = req.body.employeeId || req.user.employee?.id || req.user.id;
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

  async listRequests(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const requests = await leaveService.listLeaveRequests(companyId, req.query);
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
      const companyId = req.user.companyId;
      const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
      const calendar = await leaveService.getLeaveCalendar(companyId, month, year);
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

  async getEmployeeHistory(req, res, next) {
    try {
      const employeeId = req.params.employeeId || req.user.employee?.id || req.user.id;
      const history = await leaveService.getEmployeeLeaveHistory(employeeId, req.query);
      res.status(200).json({ status: 'ok', data: { history } });
    } catch (err) {
      next(err);
    }
  }
};

export default leaveController;
