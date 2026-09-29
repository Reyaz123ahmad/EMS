import payrollService from './payroll.service.js';
import {
  createSalaryComponentSchema,
  updateSalaryComponentSchema,
  updateSalaryStructureSchema,
  bulkUpdateStructureSchema,
  payrollRunSchema
} from './payroll.validator.js';
import { getAuthEmployeeId, getAuthEmployee, getManagerTeamIds } from '../../security/data-scope.js';

export const payrollController = {
  async listComponents(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const components = await payrollService.listSalaryComponents(companyId);
      res.status(200).json({ status: 'ok', data: { components } });
    } catch (err) {
      next(err);
    }
  },

  async createComponent(req, res, next) {
    try {
      const { error, value } = createSalaryComponentSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const created = await payrollService.createSalaryComponent(companyId, value);
      res.status(201).json({ status: 'ok', message: 'Salary component created', data: created });
    } catch (err) {
      next(err);
    }
  },

  async updateComponent(req, res, next) {
    try {
      const { error, value } = updateSalaryComponentSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const updated = await payrollService.updateSalaryComponent(req.params.id, value);
      res.status(200).json({ status: 'ok', message: 'Salary component updated', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteComponent(req, res, next) {
    try {
      await payrollService.deleteSalaryComponent(req.params.id);
      res.status(200).json({ status: 'ok', message: 'Salary component deleted' });
    } catch (err) {
      next(err);
    }
  },

  async listStructureTemplates(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const templates = await payrollService.listStructureTemplates(companyId);
      res.status(200).json({ status: 'ok', data: { templates } });
    } catch (err) {
      next(err);
    }
  },

  async createStructureTemplate(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const created = await payrollService.createStructureTemplate(companyId, req.body);
      res.status(201).json({ status: 'ok', message: 'Salary structure template created successfully', data: created });
    } catch (err) {
      next(err);
    }
  },

  async getStructure(req, res, next) {
    try {
      const employeeId = req.params.employeeId || req.user.employee?.id || req.user.id;
      const structure = await payrollService.getEmployeeSalaryStructure(employeeId);
      res.status(200).json({ status: 'ok', data: { structure } });
    } catch (err) {
      next(err);
    }
  },

  async updateStructure(req, res, next) {
    try {
      const { error, value } = updateSalaryStructureSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const employeeId = req.params.employeeId;
      const updated = await payrollService.updateEmployeeSalaryStructure(employeeId, value);
      res.status(200).json({ status: 'ok', message: 'Salary structure updated', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async bulkUpdateStructure(req, res, next) {
    try {
      const { error, value } = bulkUpdateStructureSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const updatedBy = req.user.id;
      const result = await payrollService.bulkUpdateSalaryStructure({ ...value, companyId, updatedBy });
      res.status(200).json({ status: 'ok', message: 'Salary structures bulk updated', data: result });
    } catch (err) {
      next(err);
    }
  },

  async preview(req, res, next) {
    try {
      const { error, value } = payrollRunSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const previewData = await payrollService.previewPayroll({ companyId, ...value });
      res.status(200).json({ status: 'ok', data: previewData });
    } catch (err) {
      next(err);
    }
  },

  async process(req, res, next) {
    try {
      const { error, value } = payrollRunSchema.validate(req.body);
      if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

      const companyId = req.user.companyId;
      const processedBy = req.user.id;
      const run = await payrollService.processPayroll({ companyId, ...value, processedBy });
      res.status(201).json({ status: 'ok', message: 'Payroll processed successfully', data: run });
    } catch (err) {
      next(err);
    }
  },

  async approve(req, res, next) {
    try {
      const approvedBy = req.user.id;
      const approved = await payrollService.approvePayroll({ payrollRunId: req.params.id, approvedBy });
      res.status(200).json({ status: 'ok', message: 'Payroll run approved', data: approved });
    } catch (err) {
      next(err);
    }
  },

  async listRuns(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      if (role !== 'SUPER_ADMIN' && role !== 'COMPANY_ADMIN' && role !== 'HR_ADMIN') {
        return res.status(403).json({ status: 'error', message: 'Access denied: Insufficient permissions to view payroll runs' });
      }

      const companyId = req.user.companyId;
      const runs = await payrollService.listPayrollRuns(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { runs } });
    } catch (err) {
      next(err);
    }
  },

  async getRunDetail(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      if (role !== 'SUPER_ADMIN' && role !== 'COMPANY_ADMIN' && role !== 'HR_ADMIN') {
        return res.status(403).json({ status: 'error', message: 'Access denied: Insufficient permissions to view payroll run details' });
      }

      const run = await payrollService.getPayrollRunDetail(req.params.id);
      res.status(200).json({ status: 'ok', data: { run } });
    } catch (err) {
      next(err);
    }
  },

  async getMySlips(req, res, next) {
    try {
      const employeeId = await getAuthEmployeeId(req);
      const companyId = req.user.companyId;

      if (!employeeId) {
        return res.status(404).json({ status: 'error', success: false, message: 'Employee profile not found' });
      }

      const slips = await payrollService.getMySlips({
        employeeId,
        companyId,
        filters: req.query
      });

      res.status(200).json({ status: 'ok', success: true, message: 'My payslips retrieved', data: { slips }, slips });
    } catch (err) {
      next(err);
    }
  },

  async listSlips(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user.companyId;
      const filters = { ...req.query };

      if (role === 'EMPLOYEE') {
        filters.employeeId = await getAuthEmployeeId(req);
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        filters.employeeIds = await getManagerTeamIds(emp?.id);
      } else if (role === 'HR_MANAGER') {
        const emp = await getAuthEmployee(req);
        if (emp?.departmentId) filters.departmentId = emp.departmentId;
      }

      const slips = await payrollService.listSalarySlips(companyId, filters);
      res.status(200).json({ status: 'ok', success: true, message: 'Salary slips retrieved', data: { slips }, slips });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await payrollService.getPayrollStats(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { stats } });
    } catch (err) {
      next(err);
    }
  },

  async generatePDFs(req, res, next) {
    try {
      const result = await payrollService.generateSalarySlipsPDF({ payrollRunId: req.params.id });
      res.status(200).json({ status: 'ok', message: 'Salary slip PDFs generated', data: result });
    } catch (err) {
      next(err);
    }
  },

  async sendSlips(req, res, next) {
    try {
      const result = await payrollService.sendSalarySlips({ payrollRunId: req.params.id });
      res.status(200).json({ status: 'ok', message: 'Salary slips notifications queued', data: result });
    } catch (err) {
      next(err);
    }
  },

  async downloadSlip(req, res, next) {
    try {
      const { id } = req.params;
      const role = req.user?.role || 'EMPLOYEE';
      const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || role === 'SUPER_ADMIN';
      const companyId = isSuperAdmin ? null : (req.user?.companyId || req.user?.company?.id);

      const where = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const { default: prismaClient } = await import('../../config/prisma.js');
      const slip = await prismaClient.salarySlip.findFirst({
        where,
        include: {
          payrollItem: {
            include: {
              employee: {
                include: {
                  department: true,
                  designation: true,
                }
              },
              payrollRun: true,
              lineItems: true
            }
          }
        }
      }).catch(() => null);

      if (!slip) {
        return res.status(404).json({ status: 'error', message: 'Salary slip not found' });
      }

      const slipEmpId = slip.payrollItem?.employeeId;
      // Ownership check
      if (role === 'EMPLOYEE') {
        const authEmpId = await getAuthEmployeeId(req);
        if (slipEmpId && slipEmpId !== authEmpId) {
          return res.status(403).json({ status: 'error', message: 'Access denied: You cannot access another employee’s salary slip' });
        }
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        const teamIds = await getManagerTeamIds(emp?.id);
        if (slipEmpId && !teamIds.includes(slipEmpId)) {
          return res.status(403).json({ status: 'error', message: 'Access denied: Salary slip belongs outside your team' });
        }
      } else if (role === 'HR_MANAGER') {
        const emp = await getAuthEmployee(req);
        if (slip.payrollItem?.employee?.departmentId && emp?.departmentId && slip.payrollItem.employee.departmentId !== emp.departmentId) {
          return res.status(403).json({ status: 'error', message: 'Access denied: Salary slip belongs to a different department' });
        }
      }

      if (!slip.payrollItem?.lineItems || slip.payrollItem.lineItems.length === 0) {
        return res.status(500).json({ status: 'error', message: 'PDF gen refused: no component breakdown' });
      }

      const { generateSalarySlipPDFStream } = await import('../../utils/pdfGenerator.js');
      return generateSalarySlipPDFStream(slip, res);
    } catch (err) {
      next(err);
    }
  },

  async listSalaryStructures(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await payrollService.listSalaryStructures({
        companyId,
        filters: req.query,
        pagination: {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 20
        }
      });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  async listReimbursements(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await payrollService.listReimbursements({
        companyId,
        filters: req.query,
        pagination: {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 20
        }
      });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  async listLoansAdvances(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await payrollService.listLoansAdvances({
        companyId,
        filters: req.query,
        pagination: {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 20
        }
      });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  async listTaxSlabs(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await payrollService.listTaxSlabs({ companyId });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getPayrollAnalytics(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await payrollService.getPayrollAnalytics({ companyId, filters: req.query });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  }
};

export const listSalaryStructures = payrollController.listSalaryStructures;
export const listReimbursements = payrollController.listReimbursements;
export const listLoansAdvances = payrollController.listLoansAdvances;
export const listTaxSlabs = payrollController.listTaxSlabs;
export const getPayrollAnalytics = payrollController.getPayrollAnalytics;

export default payrollController;
