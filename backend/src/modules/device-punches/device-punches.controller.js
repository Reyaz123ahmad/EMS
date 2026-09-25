import { devicePunchesService } from './device-punches.service.js';
import { devicePunchSchema, punchFiltersSchema, punchStatsSchema } from './device-punches.validator.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const devicePunchesController = {
  receivePunch: async (req, res, next) => {
    try {
      const { error, value } = devicePunchSchema.validate(req.body);
      if (error) {
        return sendError(res, error.details[0].message, 400);
      }

      const deviceId = req.device?.id || value.deviceId;
      const companyId = req.device?.companyId || req.user?.companyId;

      if (!deviceId || !companyId) {
        return sendError(res, 'Device ID and Company ID required', 400);
      }

      const result = await devicePunchesService.receivePunch({
        ...value,
        deviceId,
        companyId
      });

      return sendSuccess(res, result, 'Punch received and recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  listPunches: async (req, res, next) => {
    try {
      const { error, value } = punchFiltersSchema.validate(req.query);
      if (error) {
        return sendError(res, error.details[0].message, 400);
      }

      const { page, limit, ...filters } = value;
      const result = await devicePunchesService.listPunches(
        req.user.companyId,
        filters,
        { page, limit }
      );

      return sendSuccess(res, result, 'Device punches retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  reprocessPunch: async (req, res, next) => {
    try {
      const punchId = req.params.id;
      const result = await devicePunchesService.reprocessPunch(
        punchId,
        req.user.companyId
      );

      return sendSuccess(res, result, 'Punch reprocessed successfully');
    } catch (err) {
      next(err);
    }
  },

  getStats: async (req, res, next) => {
    try {
      const { error, value } = punchStatsSchema.validate(req.query);
      if (error) {
        return sendError(res, error.details[0].message, 400);
      }

      const stats = await devicePunchesService.getPunchStats(
        req.user.companyId,
        value
      );

      return sendSuccess(res, stats, 'Device punch statistics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
};
