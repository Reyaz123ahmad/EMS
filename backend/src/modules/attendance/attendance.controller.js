import { successResponse } from '../../utils/response.js';
import attendanceService from './attendance.service.js';
import {
  checkInSchema,
  checkOutSchema,
  breakStartSchema,
  breakEndSchema,
  cardScanSchema,
  attendanceLogsSchema,
  monthlySummarySchema,
  attendanceStatsSchema
} from './attendance.validator.js';
import { reviewFraudSignalSchema } from '../attendance-security/attendance-security.validator.js';
import { getAuthEmployeeId, getAuthEmployee, getManagerTeamIds } from '../../security/data-scope.js';

export const attendanceController = {
  /**
   * POST /attendance/check-in
   */
  async checkIn(req, res, next) {
    try {
      const { error, value } = checkInSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const employeeId = await getAuthEmployeeId(req) || req.user?.id;
      const companyId = req.user?.companyId;

      if (!employeeId || !companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Employee ID and Company ID are required.'
        });
      }

      const result = await attendanceService.checkIn({
        ...value,
        employeeId,
        companyId
      });

      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          status: 'error',
          code: err.statusCode === 403 ? 'GEO_VERIFICATION_FAILED' : 'BAD_REQUEST',
          message: err.message
        });
      }
      if (err.message.includes('Location verification failed') || err.message.includes('Mock location') || err.message.includes('geofence')) {
        return res.status(403).json({ status: 'error', code: 'GEO_VERIFICATION_FAILED', message: err.message });
      }
      if (err.message.includes('Face verification failed') || err.message.includes('mode')) {
        return res.status(403).json({ status: 'error', code: 'SECURITY_VERIFICATION_FAILED', message: err.message });
      }
      if (err.message.includes('already checked in')) {
        return res.status(400).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  },

  /**
   * POST /attendance/check-out
   */
  async checkOut(req, res, next) {
    try {
      const { error, value } = checkOutSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const employeeId = await getAuthEmployeeId(req) || req.user?.id;
      const companyId = req.user?.companyId;

      const result = await attendanceService.checkOut({
        ...value,
        employeeId,
        companyId
      });

      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          status: 'error',
          code: err.statusCode === 403 ? 'GEO_VERIFICATION_FAILED' : 'BAD_REQUEST',
          message: err.message
        });
      }
      if (err.message.includes('Location verification failed') || err.message.includes('Mock location') || err.message.includes('geofence')) {
        return res.status(403).json({ status: 'error', code: 'GEO_VERIFICATION_FAILED', message: err.message });
      }
      if (err.message.includes('not checked in') || err.message.includes('already checked out')) {
        return res.status(400).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  },

  /**
   * POST /attendance/break-start
   */
  async startBreak(req, res, next) {
    try {
      const { error, value } = breakStartSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const employeeId = await getAuthEmployeeId(req) || req.user?.id;
      const companyId = req.user?.companyId;

      const result = await attendanceService.startBreak({
        ...value,
        employeeId,
        companyId
      });

      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  },

  /**
   * POST /attendance/break-end
   */
  async endBreak(req, res, next) {
    try {
      const { error, value } = breakEndSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const employeeId = await getAuthEmployeeId(req) || req.user?.id;
      const companyId = req.user?.companyId;

      const result = await attendanceService.endBreak({
        ...value,
        employeeId,
        companyId
      });

      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  },

  /**
   * GET /attendance/today
   */
  async getTodayStatus(req, res, next) {
    try {
      const employeeId = await getAuthEmployeeId(req) || req.user?.id;
      const companyId = req.user?.companyId;

      const result = await attendanceService.getTodayStatus(employeeId, companyId);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /attendance/checkout-status
   */
  async getCheckoutStatus(req, res, next) {
    try {
      const employeeId = await getAuthEmployeeId(req) || req.user?.id;
      const companyId = req.user?.companyId;

      const result = await attendanceService.canCheckout(employeeId, companyId);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /attendance/break-status
   */
  async getBreakStatus(req, res, next) {
    try {
      const employeeId = await getAuthEmployeeId(req) || req.user?.id;
      const companyId = req.user?.companyId;

      const result = await attendanceService.checkBreakLimit(employeeId, companyId);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /attendance/logs
   */
  async listLogs(req, res, next) {
    try {
      const { error, value } = attendanceLogsSchema.validate(req.query);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user?.companyId;
      const { page, limit, ...filters } = value;

      // Anti-leakage role scoping
      if (role === 'EMPLOYEE') {
        const empId = await getAuthEmployeeId(req);
        filters.employeeId = empId || '__NO_ACCESS__';
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        const teamIds = await getManagerTeamIds(emp?.id);
        filters.employeeIds = teamIds.length > 0 ? teamIds : ['__NO_ACCESS__'];
      } else if (role === 'HR_MANAGER') {
        const emp = await getAuthEmployee(req);
        if (emp?.departmentId) {
          filters.departmentId = emp.departmentId;
        }
      }

      const result = await attendanceService.listAttendanceLogs(companyId, filters, { page, limit });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /attendance/monthly-summary
   */
  async getMonthlySummary(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user?.companyId;
      const { month, year, employeeId } = req.query;

      const result = await attendanceService.getMonthlySummary({
        companyId,
        employeeId: role === 'EMPLOYEE' ? await getAuthEmployeeId(req) : employeeId,
        month: parseInt(month) || new Date().getMonth() + 1,
        year: parseInt(year) || new Date().getFullYear(),
        role
      });

      return successResponse(res, result, 'Monthly summary retrieved');
    } catch (error) {
      next(error);
    }
  },


  /**
   * GET /attendance/stats
   */
  async getStats(req, res, next) {
    try {
      const { error, value } = attendanceStatsSchema.validate(req.query);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const companyId = req.user?.companyId;
      const date = value.date || new Date();

      const result = await attendanceService.getAttendanceStats(companyId, date);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /attendance/fraud-signals
   */
  async listFraudSignals(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const result = await attendanceService.listFraudSignals(companyId, req.query);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /attendance/fraud-signals/:id/review
   */
  async reviewFraudSignal(req, res, next) {
    try {
      const { error, value } = reviewFraudSignalSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const signalId = req.params.id;
      const reviewedBy = req.user?.id;

      const result = await attendanceService.reviewFraudSignal(
        signalId,
        reviewedBy,
        value.reviewNotes,
        value.status
      );

      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /attendance/card-scan
   */
  async cardScan(req, res, next) {
    try {
      const { error, value } = cardScanSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const employeeId = await getAuthEmployeeId(req) || req.user?.id;
      const companyId = req.user?.companyId || req.body.companyId;

      const result = await attendanceService.cardScan({
        ...value,
        employeeId,
        companyId
      });

      return res.status(200).json({
        status: 'ok',
        message: 'Card attendance scanned and processed successfully',
        data: result
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          status: 'error',
          code: err.statusCode === 403 ? 'GEO_VERIFICATION_FAILED' : 'SECURITY_VERIFICATION_FAILED',
          message: err.message
        });
      }
      if (err.message?.includes('Location verification failed') || err.message?.includes('Mock location') || err.message?.includes('geofence')) {
        return res.status(403).json({ status: 'error', code: 'GEO_VERIFICATION_FAILED', message: err.message });
      }
      if (err.message?.includes('signature') || err.message?.includes('tampered') || err.message?.includes('deactivated')) {
        return res.status(400).json({ status: 'error', code: 'INVALID_QR_CARD', message: err.message });
      }
      next(err);
    }
  },

  /**
   * GET /attendance/calendar
   */
  async getCalendar(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user?.companyId;
      const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
      let { employeeId, departmentId, branchId } = req.query;

      if (role === 'EMPLOYEE') {
        employeeId = await getAuthEmployeeId(req);
      } else if (role === 'HR_MANAGER') {
        const emp = await getAuthEmployee(req);
        departmentId = emp?.departmentId;
      }

      const calendar = await attendanceService.getAttendanceCalendar(companyId, month, year, { employeeId, departmentId, branchId });
      res.status(200).json({ status: 'ok', data: calendar });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /attendance/employee-summary
   */
  async getEmployeeSummary(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      let employeeId = req.query.employeeId;

      if (role === 'EMPLOYEE' || !employeeId) {
        employeeId = await getAuthEmployeeId(req) || req.user?.id;
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        const teamIds = await getManagerTeamIds(emp?.id);
        if (!teamIds.includes(employeeId)) {
          return res.status(403).json({ status: 'error', message: 'Access denied: Employee not in your team' });
        }
      }

      const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
      const summary = await attendanceService.getEmployeeAttendanceSummary(employeeId, month, year);
      res.status(200).json({ status: 'ok', data: summary });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /attendance/manual
   */
  async markManual(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const markedBy = req.user?.id;
      const { employeeId, date, checkIn, checkOut, status, reason } = req.body;
      if (!employeeId || !date) {
        return res.status(400).json({ status: 'error', message: 'employeeId and date are required' });
      }
      const log = await attendanceService.markManualAttendance({
        employeeId,
        date,
        checkIn,
        checkOut,
        status,
        reason,
        markedBy,
        companyId
      });
      res.status(200).json({ status: 'ok', message: 'Manual attendance marked successfully', data: log });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /attendance/bulk-mark
   */
  async bulkMark(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const markedBy = req.user?.id;
      const { employeeIds, date, status, reason } = req.body;
      if (!employeeIds || !Array.isArray(employeeIds) || !date) {
        return res.status(400).json({ status: 'error', message: 'employeeIds array and date are required' });
      }
      const result = await attendanceService.bulkMarkAttendance({
        employeeIds,
        date,
        status,
        reason,
        markedBy,
        companyId
      });
      res.status(200).json({ status: 'ok', message: 'Bulk attendance recorded', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /attendance/exceptions
   */
  async getExceptions(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const { startDate, endDate } = req.query;
      const exceptions = await attendanceService.getAttendanceExceptions(companyId, { startDate, endDate });
      res.status(200).json({ status: 'ok', data: exceptions });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /attendance/overtime-tracker
   */
  async getOvertimeTracker(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user?.companyId;
      const employeeId = role === 'EMPLOYEE' ? await getAuthEmployeeId(req) : req.query.employeeId;
      const result = await attendanceService.getOvertimeTracker({ companyId, employeeId, role });
      return successResponse(res, result, 'Overtime tracker data retrieved');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /attendance/shift-roster
   */
  async getShiftRoster(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user?.companyId;
      const employeeId = role === 'EMPLOYEE' ? await getAuthEmployeeId(req) : req.query.employeeId;
      const result = await attendanceService.getShiftRoster({ companyId, employeeId, role });
      return successResponse(res, result, 'Shift roster data retrieved');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /attendance/qr-scanner
   */
  async getQrScanner(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user?.companyId;
      const employeeId = role === 'EMPLOYEE' ? await getAuthEmployeeId(req) : req.query.employeeId;
      const result = await attendanceService.getQrScanner({ companyId, employeeId });
      return successResponse(res, result, 'QR scanner status retrieved');
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /attendance/live-location
   */
  async getLiveLocation(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const result = await attendanceService.getLiveLocation({ companyId });
      return successResponse(res, result, 'Live location tracking data retrieved');
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /attendance/policy
   */
  async updatePolicy(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const result = await attendanceService.updateAttendancePolicy(companyId, req.body);
      return successResponse(res, result, 'Attendance policy updated');
    } catch (err) {
      next(err);
    }
  }
};

export const getMonthlySummary = attendanceController.getMonthlySummary.bind(attendanceController);
export const getExceptions = attendanceController.getExceptions.bind(attendanceController);
export const getStats = attendanceController.getStats.bind(attendanceController);
export const getOvertimeTracker = attendanceController.getOvertimeTracker.bind(attendanceController);
export const getShiftRoster = attendanceController.getShiftRoster.bind(attendanceController);
export const getFraudSignals = attendanceController.listFraudSignals.bind(attendanceController);
export const getQrScanner = attendanceController.getQrScanner.bind(attendanceController);
export const getLiveLocation = attendanceController.getLiveLocation.bind(attendanceController);

export default attendanceController;

