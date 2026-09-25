import { advancedSecurityService } from './advanced-security.service.js';
import {
  deviceAttestationSchema,
  securitySettingsSchema,
  fraudReviewSchema,
  validateIpSchema,
  detectVpnSchema
} from './advanced-security.validator.js';
import { sendSuccess } from '../../utils/response.js';

export const advancedSecurityController = {
  attestDevice: async (req, res, next) => {
    try {
      const value = await deviceAttestationSchema.validateAsync(req.body);
      const result = await advancedSecurityService.attestDevice(value);
      return sendSuccess(res, result, 'Device attestation verified', 200);
    } catch (err) {
      next(err);
    }
  },

  validateIP: async (req, res, next) => {
    try {
      const value = await validateIpSchema.validateAsync(req.body);
      const result = await advancedSecurityService.validateIPAddress({
        ipAddress: value.ipAddress,
        companyId: req.user.companyId
      });
      return sendSuccess(res, result, 'IP validation evaluated');
    } catch (err) {
      next(err);
    }
  },

  detectVPN: async (req, res, next) => {
    try {
      const value = await detectVpnSchema.validateAsync(req.body);
      const result = await advancedSecurityService.detectVPN(value);
      return sendSuccess(res, result, 'VPN network detection evaluated');
    } catch (err) {
      next(err);
    }
  },

  getSecurityScore: async (req, res, next) => {
    try {
      const { employeeId } = req.query;
      const result = await advancedSecurityService.getSecurityScore({
        employeeId,
        companyId: req.user.companyId
      });
      return sendSuccess(res, result, 'Security score evaluated');
    } catch (err) {
      next(err);
    }
  },

  updateSecuritySettings: async (req, res, next) => {
    try {
      const value = await securitySettingsSchema.validateAsync(req.body);
      const result = await advancedSecurityService.updateSecuritySettings({
        companyId: req.user.companyId,
        settings: value,
        updatedBy: req.user.id
      });
      return sendSuccess(res, result, 'Security settings updated');
    } catch (err) {
      next(err);
    }
  },

  getSecurityDashboard: async (req, res, next) => {
    try {
      const result = await advancedSecurityService.getSecurityDashboard(req.user.companyId);
      return sendSuccess(res, result, 'Security dashboard retrieved');
    } catch (err) {
      next(err);
    }
  },

  reviewFraudSignal: async (req, res, next) => {
    try {
      const { id } = req.params;
      const value = await fraudReviewSchema.validateAsync(req.body);
      const result = await advancedSecurityService.reviewFraudSignal({
        signalId: id,
        companyId: req.user.companyId,
        action: value.action,
        notes: value.notes,
        reviewedBy: req.user.id
      });
      return sendSuccess(res, result, 'Fraud signal reviewed');
    } catch (err) {
      next(err);
    }
  },

  getSecurityEvents: async (req, res, next) => {
    try {
      const companyId = req.query.companyId || req.user?.companyId;
      const result = await advancedSecurityService.getSecurityEvents(companyId, req.query);
      return sendSuccess(res, result, 'Security events retrieved');
    } catch (err) {
      next(err);
    }
  },

  getAuditLogs: async (req, res, next) => {
    try {
      const companyId = req.query.companyId || req.user?.companyId;
      const result = await advancedSecurityService.getAuditLogs(companyId, req.query);
      return sendSuccess(res, result, 'Audit logs retrieved');
    } catch (err) {
      next(err);
    }
  },

  exportAuditLogs: async (req, res, next) => {
    try {
      const companyId = req.query.companyId || req.user?.companyId;
      const result = await advancedSecurityService.exportAuditLogs(companyId, req.query);
      return sendSuccess(res, result, 'Audit logs exported');
    } catch (err) {
      next(err);
    }
  },

  blockEmployee: async (req, res, next) => {
    try {
      const { employeeId, reason } = req.body;
      const result = await advancedSecurityService.blockEmployee({
        employeeId,
        reason,
        blockedBy: req.user.id
      });
      return sendSuccess(res, result, 'Employee blocked successfully');
    } catch (err) {
      next(err);
    }
  },

  unblockEmployee: async (req, res, next) => {
    try {
      const { employeeId } = req.body;
      const result = await advancedSecurityService.unblockEmployee({
        employeeId,
        unblockedBy: req.user.id
      });
      return sendSuccess(res, result, 'Employee unblocked successfully');
    } catch (err) {
      next(err);
    }
  },

  getBlockedEmployees: async (req, res, next) => {
    try {
      const companyId = req.query.companyId || req.user?.companyId;
      const result = await advancedSecurityService.getBlockedEmployees(companyId);
      return sendSuccess(res, result, 'Blocked employees retrieved');
    } catch (err) {
      next(err);
    }
  }
};

export default advancedSecurityController;
