import companiesService from './companies.service.js';
import { COMPANY_SETTINGS_DEFAULTS } from './companies.constants.js';
import {
  sendCompanyOTPSchema,
  verifyCompanyOTPSchema,
  createCompanySchema,
  updateCompanySchema,
  updateCompanySettingsSchema
} from './companies.validator.js';

export const companiesController = {
  /**
   * POST /companies/send-otp
   */
  async sendCompanyOTP(req, res, next) {
    try {
      const { error, value } = sendCompanyOTPSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const result = await companiesService.sendCompanyOTP(value);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /companies/verify-otp
   */
  async verifyCompanyOTP(req, res, next) {
    try {
      const { error, value } = verifyCompanyOTPSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const result = await companiesService.verifyCompanyOTP(value);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  },

  /**
   * POST /companies/create
   */
  async createCompanyWithAdmin(req, res, next) {
    try {
      const { error, value } = createCompanySchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const result = await companiesService.createCompanyWithAdmin(value);
      res.status(201).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /companies
   */
  async listCompanies(req, res, next) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const result = await companiesService.listCompanies(
        { search, status },
        { page: parseInt(page, 10), limit: parseInt(limit, 10) }
      );
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /companies/:id
   */
  async getCompany(req, res, next) {
    try {
      const { id } = req.params;
      const company = await companiesService.getCompanyById(id);
      res.status(200).json({ status: 'ok', data: { company } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /companies/:id
   */
  async updateCompany(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = updateCompanySchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const company = await companiesService.updateCompany(id, value);
      res.status(200).json({ status: 'ok', data: { company } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /companies/:id/settings
   */
  async getSettings(req, res, next) {
    try {
      const { id } = req.params;
      const settings = await companiesService.getCompanySettings(id);
      res.status(200).json({ status: 'ok', data: settings });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /companies/:id/settings
   */
  async updateSettings(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = updateCompanySettingsSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const updated = await companiesService.updateCompanySettings(
        id,
        value.settingsType,
        value.settingsData
      );
      res.status(200).json({ status: 'ok', data: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /companies/:id/dashboard
   */
  async getDashboard(req, res, next) {
    try {
      const { id } = req.params;
      const dashboard = await companiesService.getCompanyDashboard(id);
      res.status(200).json({ status: 'ok', data: dashboard });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /companies/stats or /companies/:id/stats
   */
  async getStats(req, res, next) {
    try {
      const companyId = req.params.id || req.user?.companyId || req.query.companyId;
      const stats = await companiesService.getCompanyStats(companyId);
      res.status(200).json({ status: 'ok', data: stats });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /companies/analytics or /companies/:id/analytics
   */
  async getAnalytics(req, res, next) {
    try {
      const companyId = req.params.id || req.user?.companyId || req.query.companyId;
      const stats = await companiesService.getCompanyStats(companyId);
      res.status(200).json({ status: 'ok', data: stats });
    } catch (err) {
      next(err);
    }
  },


  /**
   * Granular settings handlers
   */
  async getSettingsSchema(req, res, next) {
    try {
      res.status(200).json({ status: 'ok', data: COMPANY_SETTINGS_DEFAULTS });
    } catch (err) {
      next(err);
    }
  },

  async getSettingByType(req, res, next) {
    try {
      const { id, type } = req.params;
      const settings = await companiesService.getCompanySettings(id);
      const fieldMap = {
        attendance: 'attendanceSettings',
        security: 'securitySettings',
        leave: 'leaveSettings',
        payroll: 'payrollSettings',
        notifications: 'notificationSettings',
        general: 'generalSettings'
      };
      const field = fieldMap[type] || `${type}Settings`;
      const defaults = COMPANY_SETTINGS_DEFAULTS[field] || {};
      const data = { ...defaults, ...(settings[field] || {}) };
      res.status(200).json({ status: 'ok', data });
    } catch (err) {
      next(err);
    }
  },

  async updateSettingByType(req, res, next) {
    try {
      const { id, type } = req.params;
      const updated = await companiesService.updateCompanySettings(id, type, req.body);
      res.status(200).json({ status: 'ok', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async resetSettings(req, res, next) {
    try {
      const { id } = req.params;
      const { settingType = 'general' } = req.body;
      const fieldMap = {
        attendance: 'attendanceSettings',
        security: 'securitySettings',
        leave: 'leaveSettings',
        payroll: 'payrollSettings',
        notifications: 'notificationSettings',
        general: 'generalSettings'
      };
      const field = fieldMap[settingType] || `${settingType}Settings`;
      const defaults = COMPANY_SETTINGS_DEFAULTS[field] || {};
      const result = await companiesService.updateCompanySettings(id, settingType, defaults);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /companies/:id/activate
   */
  async activateCompany(req, res, next) {
    try {
      const { id } = req.params;
      const company = await companiesService.activateCompany(id);
      res.status(200).json({ status: 'ok', message: 'Company activated successfully', data: { company } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /companies/:id/deactivate
   */
  async deactivateCompany(req, res, next) {
    try {
      const { id } = req.params;
      const company = await companiesService.deactivateCompany(id);
      res.status(200).json({ status: 'ok', message: 'Company deactivated successfully', data: { company } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /companies/:id/suspend
   */
  async suspendCompany(req, res, next) {
    try {
      const { id } = req.params;
      const company = await companiesService.suspendCompany(id);
      res.status(200).json({ status: 'ok', message: 'Company suspended successfully', data: { company } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /companies/:id
   */
  async deleteCompany(req, res, next) {
    try {
      const { id } = req.params;
      await companiesService.deleteCompany(id);
      res.status(200).json({ status: 'ok', message: 'Company deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
};

export default companiesController;
