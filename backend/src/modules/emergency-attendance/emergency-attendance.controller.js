import { emergencyAttendanceService } from './emergency-attendance.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const emergencyAttendanceController = {
  async getRequests(req, res) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const requests = await emergencyAttendanceService.getRequests(companyId, req.query);
      return sendSuccess(res, requests, 'Emergency attendance requests retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getRequestById(req, res) {
    try {
      const request = await emergencyAttendanceService.getRequestById(req.params.id);
      if (!request) {
        return sendError(res, 'Request not found', 404);
      }
      return sendSuccess(res, request, 'Emergency attendance request retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async createRequest(req, res) {
    try {
      const employeeId = req.user?.employee?.id || req.body.employeeId;
      if (!employeeId) {
        return sendError(res, 'Employee ID is required', 400);
      }
      const request = await emergencyAttendanceService.createRequest({
        ...req.body,
        employeeId,
      });
      return sendSuccess(res, request, 'Emergency attendance request submitted', 201);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async approveRequest(req, res) {
    try {
      const approvedBy = req.user?.id;
      const request = await emergencyAttendanceService.approveRequest({
        requestId: req.params.id,
        approvedBy,
      });
      return sendSuccess(res, request, 'Emergency attendance approved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async rejectRequest(req, res) {
    try {
      const rejectedBy = req.user?.id;
      const request = await emergencyAttendanceService.rejectRequest({
        requestId: req.params.id,
        reason: req.body.reason,
        rejectedBy,
      });
      return sendSuccess(res, request, 'Emergency attendance rejected');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async bulkApprove(req, res) {
    try {
      const approvedBy = req.user?.id;
      const result = await emergencyAttendanceService.bulkApproveEmergency({
        requestIds: req.body.requestIds,
        approvedBy,
      });
      return sendSuccess(res, result, `${result.count} requests approved in bulk`);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getEmergencyStats(req, res) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const stats = await emergencyAttendanceService.getEmergencyStats(companyId);
      return sendSuccess(res, stats, 'Emergency attendance stats retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },
};
