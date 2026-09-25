import { biometricDevicesService } from './biometric-devices.service.js';
import {
  createDeviceSchema,
  updateDeviceSchema,
  deviceFiltersSchema
} from './biometric-devices.validator.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const biometricDevicesController = {
  createDevice: async (req, res, next) => {
    try {
      const { error, value } = createDeviceSchema.validate(req.body);
      if (error) {
        return sendError(res, error.details[0].message, 400);
      }

      const device = await biometricDevicesService.createDevice({
        ...value,
        companyId: req.user.companyId
      });

      return sendSuccess(res, device, 'Biometric device registered successfully. Secure API key generated.', 201);
    } catch (err) {
      next(err);
    }
  },

  regenerateApiKey: async (req, res, next) => {
    try {
      const result = await biometricDevicesService.regenerateApiKey(
        req.params.id,
        req.user.companyId
      );

      return sendSuccess(res, result, 'API key regenerated successfully');
    } catch (err) {
      next(err);
    }
  },

  listDevices: async (req, res, next) => {
    try {
      const { error, value } = deviceFiltersSchema.validate(req.query);
      if (error) {
        return sendError(res, error.details[0].message, 400);
      }

      const { page, limit, ...filters } = value;
      const result = await biometricDevicesService.listDevices(
        req.user.companyId,
        filters,
        { page, limit }
      );

      return sendSuccess(res, result, 'Biometric devices retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  getDevice: async (req, res, next) => {
    try {
      const device = await biometricDevicesService.getDeviceById(
        req.params.id,
        req.user.companyId
      );

      return sendSuccess(res, device, 'Biometric device retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  updateDevice: async (req, res, next) => {
    try {
      const { error, value } = updateDeviceSchema.validate(req.body);
      if (error) {
        return sendError(res, error.details[0].message, 400);
      }

      const updated = await biometricDevicesService.updateDevice(
        req.params.id,
        value,
        req.user.companyId
      );

      return sendSuccess(res, updated, 'Biometric device updated successfully');
    } catch (err) {
      next(err);
    }
  },

  deactivateDevice: async (req, res, next) => {
    try {
      const deactivated = await biometricDevicesService.deactivateDevice(
        req.params.id,
        req.user.companyId
      );

      return sendSuccess(res, deactivated, 'Biometric device deactivated successfully');
    } catch (err) {
      next(err);
    }
  },

  getStatus: async (req, res, next) => {
    try {
      const status = await biometricDevicesService.getDeviceStatus(
        req.params.id,
        req.user.companyId
      );

      return sendSuccess(res, status, 'Biometric device status retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
};
