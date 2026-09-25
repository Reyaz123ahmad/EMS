import { fingerAttendanceService } from './finger-attendance.service.js';
import {
  fingerEnrollSchema,
  fingerDevicePunchSchema,
  fingerFiltersSchema,
  deleteEnrollmentSchema
} from './finger-attendance.validator.js';
import { sendSuccess } from '../../utils/response.js';

export const fingerAttendanceController = {
  enrollFinger: async (req, res, next) => {
    try {
      const value = await fingerEnrollSchema.validateAsync(req.body);
      const result = await fingerAttendanceService.enrollFinger({
        ...value,
        companyId: req.user.companyId,
        enrolledBy: req.user.id
      });
      return sendSuccess(res, result, 'Fingerprint enrolled successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  deleteFingerEnrollment: async (req, res, next) => {
    try {
      const value = await deleteEnrollmentSchema.validateAsync({
        employeeId: req.params.employeeId,
        fingerIndex: Number(req.params.fingerIndex)
      });
      const result = await fingerAttendanceService.deleteFingerEnrollment({
        ...value,
        companyId: req.user.companyId,
        deletedBy: req.user.id
      });
      return sendSuccess(res, result, 'Fingerprint enrollment removed');
    } catch (err) {
      next(err);
    }
  },

  receiveFingerPunch: async (req, res, next) => {
    try {
      const value = await fingerDevicePunchSchema.validateAsync(req.body);
      const result = await fingerAttendanceService.receiveFingerPunch({
        deviceId: req.device.id,
        companyId: req.device.companyId,
        payload: value
      });
      return sendSuccess(res, result, 'Fingerprint punch received', 201);
    } catch (err) {
      next(err);
    }
  },

  processFingerPunch: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await fingerAttendanceService.processFingerPunch(id);
      return sendSuccess(res, result, 'Finger punch processed');
    } catch (err) {
      next(err);
    }
  },

  syncToDevice: async (req, res, next) => {
    try {
      const { deviceId } = req.params;
      const result = await fingerAttendanceService.syncFingerTemplatesToDevice({
        deviceId,
        companyId: req.user.companyId
      });
      return sendSuccess(res, result, 'Templates synchronized to device');
    } catch (err) {
      next(err);
    }
  },

  listFingerPunches: async (req, res, next) => {
    try {
      const filters = await fingerFiltersSchema.validateAsync(req.query);
      const result = await fingerAttendanceService.listFingerPunches(
        req.user.companyId,
        filters,
        { page: filters.page, limit: filters.limit }
      );
      return sendSuccess(res, result, 'Finger punches retrieved');
    } catch (err) {
      next(err);
    }
  },

  getStats: async (req, res, next) => {
    try {
      const result = await fingerAttendanceService.getFingerStats(req.user.companyId);
      return sendSuccess(res, result, 'Finger attendance statistics retrieved');
    } catch (err) {
      next(err);
    }
  },

  getEmployeeEnrollments: async (req, res, next) => {
    try {
      const { employeeId } = req.params;
      const result = await fingerAttendanceService.getEmployeeEnrollments(employeeId, req.user.companyId);
      return sendSuccess(res, result, 'Employee enrolled fingers retrieved');
    } catch (err) {
      next(err);
    }
  }
};

export default fingerAttendanceController;
