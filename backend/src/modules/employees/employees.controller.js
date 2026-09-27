import employeesService from './employees.service.js';
import {
  sendEmployeeOTPSchema,
  verifyEmployeeOTPSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeFiltersSchema
} from './employees.validator.js';

export const employeesController = {
  /**
   * POST /employees/send-otp
   */
  async sendEmployeeOTP(req, res, next) {
    try {
      const { error, value } = sendEmployeeOTPSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const companyId = req.user?.companyId || req.body.companyId;
      if (!companyId) {
        return res.status(400).json({ status: 'error', message: 'Company ID is required.' });
      }

      const result = await employeesService.sendEmployeeOTP({
        employeeData: value.employeeData,
        companyId,
        createdBy: req.user?.id
      });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /employees/verify-otp
   */
  async verifyEmployeeOTP(req, res, next) {
    try {
      const { error, value } = verifyEmployeeOTPSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const result = await employeesService.verifyEmployeeOTP(value);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  },

  /**
   * POST /employees/create
   */
  async createEmployeeWithUser(req, res, next) {
    try {
      const { error, value } = createEmployeeSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const companyId = req.user?.companyId || req.body.companyId;
      if (!companyId) {
        return res.status(400).json({ status: 'error', message: 'Company ID is required.' });
      }

      const result = await employeesService.createEmployeeWithUser({
        sessionId: value.sessionId,
        employeeData: value.employeeData,
        companyId,
        createdBy: req.user?.id
      });
      res.status(201).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees
   */
  async listEmployees(req, res, next) {
    try {
      const { error, value } = employeeFiltersSchema.validate(req.query);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const companyId = req.user?.companyId;
      const { page, limit, ...filters } = value;

      const result = await employeesService.listEmployees(companyId, filters, { page, limit });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees/:id
   */
  async getEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await employeesService.getEmployeeById(id);
      res.status(200).json({ status: 'ok', data: { employee } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /employees/:id
   */
  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = updateEmployeeSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const employee = await employeesService.updateEmployee(id, value, req.user?.companyId, req.user?.id);
      res.status(200).json({
        status: 'ok',
        message: 'Employee updated successfully.',
        data: { employee }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /employees/:id
   */
  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await employeesService.deleteEmployee(id);
      res.status(200).json({
        status: 'ok',
        message: 'Employee deleted successfully.',
        data: { employee }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees/:id/dashboard
   */
  async getDashboard(req, res, next) {
    try {
      const { id } = req.params;
      const dashboard = await employeesService.getEmployeeDashboard(id);
      res.status(200).json({ status: 'ok', data: dashboard });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /employees/:id/face
   */
  async registerFace(req, res, next) {
    try {
      const { id } = req.params;
      const { photoUrl, embedding } = req.body;
      if (!photoUrl) {
        return res.status(400).json({ status: 'error', message: 'photoUrl is required.' });
      }

      const employee = await employeesService.registerFace(id, photoUrl, embedding || []);
      res.status(200).json({
        status: 'ok',
        message: 'Face registered successfully.',
        data: { employee }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /employees/bulk-import
   */
  async bulkImport(req, res, next) {
    try {
      const companyId = req.user?.companyId || req.body.companyId;
      const rows = req.body.rows || [];
      const result = await employeesService.bulkImportEmployees({
        rows,
        companyId,
        createdBy: req.user?.id
      });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees/export
   */
  async exportEmployees(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const result = await employeesService.exportEmployees(companyId, req.query);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees/stats
   */
  async getStats(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const result = await employeesService.getEmployeeStats(companyId);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees/analytics
   */
  async getAnalytics(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const result = await employeesService.getEmployeeAnalytics(companyId, req.query);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  }
};

export default employeesController;
