import { faceRegistrationService } from './face-registration.service.js';
import {
  registerFaceSchema,
  updateFaceSchema,
  deleteFaceSchema,
  verifyFaceSchema,
  faceFiltersSchema,
  bulkRegisterSchema
} from './face-registration.validator.js';
import { sendSuccess } from '../../utils/response.js';

export const faceRegistrationController = {
  registerFace: async (req, res, next) => {
    try {
      const value = await registerFaceSchema.validateAsync(req.body);
      const result = await faceRegistrationService.registerFace({
        ...value,
        companyId: req.user.companyId,
        registeredBy: req.user.id
      });
      return sendSuccess(res, result, 'Face registered successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  updateFace: async (req, res, next) => {
    try {
      const value = await updateFaceSchema.validateAsync(req.body);
      const result = await faceRegistrationService.updateFace({
        ...value,
        companyId: req.user.companyId,
        updatedBy: req.user.id
      });
      return sendSuccess(res, result, 'Face biometric updated successfully');
    } catch (err) {
      next(err);
    }
  },

  deleteFace: async (req, res, next) => {
    try {
      const value = await deleteFaceSchema.validateAsync(req.body);
      const result = await faceRegistrationService.deleteFace({
        ...value,
        companyId: req.user.companyId,
        deletedBy: req.user.id
      });
      return sendSuccess(res, result, 'Face biometric deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  verifyFace: async (req, res, next) => {
    try {
      const value = await verifyFaceSchema.validateAsync(req.body);
      const result = await faceRegistrationService.verifyFace({
        ...value,
        companyId: req.user.companyId
      });
      return sendSuccess(res, result, 'Face verification completed');
    } catch (err) {
      next(err);
    }
  },

  getFaceStatus: async (req, res, next) => {
    try {
      const { employeeId } = req.params;
      const result = await faceRegistrationService.getFaceStatus(employeeId, req.user.companyId);
      return sendSuccess(res, result, 'Face enrollment status retrieved');
    } catch (err) {
      next(err);
    }
  },

  listWithFace: async (req, res, next) => {
    try {
      const filters = await faceFiltersSchema.validateAsync(req.query);
      const result = await faceRegistrationService.listEmployeesWithFace(
        req.user.companyId,
        filters,
        { page: filters.page, limit: filters.limit }
      );
      return sendSuccess(res, result, 'Enrolled employees retrieved');
    } catch (err) {
      next(err);
    }
  },

  listWithoutFace: async (req, res, next) => {
    try {
      const filters = await faceFiltersSchema.validateAsync(req.query);
      const result = await faceRegistrationService.listEmployeesWithoutFace(
        req.user.companyId,
        filters,
        { page: filters.page, limit: filters.limit }
      );
      return sendSuccess(res, result, 'Pending employees retrieved');
    } catch (err) {
      next(err);
    }
  },

  bulkRegister: async (req, res, next) => {
    try {
      const value = await bulkRegisterSchema.validateAsync(req.body);
      const result = await faceRegistrationService.bulkRegisterFace({
        ...value,
        companyId: req.user.companyId,
        registeredBy: req.user.id
      });
      return sendSuccess(res, result, 'Bulk face registration completed');
    } catch (err) {
      next(err);
    }
  },

  getStats: async (req, res, next) => {
    try {
      const result = await faceRegistrationService.getFaceRegistrationStats(req.user.companyId);
      return sendSuccess(res, result, 'Face registration statistics retrieved');
    } catch (err) {
      next(err);
    }
  },

  exportEmbeddings: async (req, res, next) => {
    try {
      const result = await faceRegistrationService.exportFaceEmbeddings(req.user.companyId);
      return sendSuccess(res, result, 'Face embeddings exported');
    } catch (err) {
      next(err);
    }
  }
};

export default faceRegistrationController;
