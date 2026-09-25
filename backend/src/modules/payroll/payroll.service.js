import { prisma } from '../../config/prisma.js';

export const payrollService = {
  /**
   * Salary Components CRUD
   */
  async listSalaryComponents(companyId) {
    return prisma.salaryComponent.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' }
    });
  },

  async createSalaryComponent(companyId, data) {
    return prisma.salaryComponent.create({
      data: {
        companyId,
        name: data.name,
        code: data.code.toUpperCase().trim(),
        type: data.type,
        calculationType: data.calculationType || 'FIXED',
        percentage: data.percentage ? parseFloat(data.percentage) : null,
        isTaxable: data.isTaxable !== undefined ? data.isTaxable : true,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  },

  async updateSalaryComponent(id, data) {
    return prisma.salaryComponent.update({
      where: { id },
      data: {
        ...data,
        percentage: data.percentage !== undefined ? parseFloat(data.percentage) : undefined
      }
    });
  },

  async deleteSalaryComponent(id) {
    return prisma.salaryComponent.delete({
      where: { id }
    });
  },

  /**
   * Employee Salary Structure
   */
  async getEmployeeSalaryStructure(employeeId) {
    return prisma.employeeSalaryStructure.findUnique({
      where: { employeeId },
      include: {
        components: {
          include: { component: true }
        },
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true, department: true, designation: true }
        }
      }
    });
  },

  async updateEmployeeSalaryStructure(employeeId, data) {
    const ctc = parseFloat(data.ctc);
    const effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : new Date();

    const structure = await prisma.employeeSalaryStructure.upsert({
      where: { employeeId },
      update: { ctc, effectiveFrom },
      create: { employeeId, ctc, effectiveFrom }
    });

    if (data.components && data.components.length > 0) {
      await prisma.salaryStructureComponent.deleteMany({
        where: { structureId: structure.id }
      });

      for (const c of data.components) {
        await prisma.salaryStructureComponent.create({
          data: {
            structureId: structure.id,
            componentId: c.componentId,
            amount: parseFloat(c.amount)
          }
        });
      }
    }

    return this.getEmployeeSalaryStructure(employeeId);
  },

  async bulkUpdateSalaryStructure({ employeeIds = [], ctc, components = [], updatedBy, companyId }) {
    const results = [];
    for (const empId of employeeIds) {
      try {
        const res = await this.updateEmployeeSalaryStructure(empId, { ctc, components });
        results.push({ employeeId: empId, status: 'SUCCESS', structureId: res.id });
      } catch (err) {
        results.push({ employeeId: empId, status: 'FAILED', error: err.message });
      }
    }
    return {
      total: employeeIds.length,
      successCount: results.filter((r) => r.status === 'SUCCESS').length,
      failedCount: results.filter((r) => r.status === 'FAILED').length,
      results
    };
  },

  /**
   * Preview Payroll
   */
  async previewPayroll({ companyId, month, year }) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    const employees = await prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: {
        salaryStructure: {
          include: { components: { include: { component: true } } }
        },
        department: true,
        designation: true
      }
    });

    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));
    const daysInMonth = new Date(y, m, 0).getDate();

    const items = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const emp of employees) {
      const attendanceLogs = await prisma.attendanceLog.findMany({
        where: {
          employeeId: emp.id,
          attendanceDate: { gte: startDate, lte: endDate }
        }
      });

      const presentDays = attendanceLogs.filter((l) => l.status === 'PRESENT' || l.status === 'LATE').length;
      const halfDays = attendanceLogs.filter((l) => l.status === 'HALF_DAY').length;
      const leaveDays = attendanceLogs.filter((l) => l.status === 'ON_LEAVE').length;
      const effectivePresent = presentDays + halfDays * 0.5 + leaveDays;
      const absentDays = Math.max(0, daysInMonth - effectivePresent);

      const monthlyCTC = emp.salaryStructure ? Number(emp.salaryStructure.ctc) / 12 : 50000;
      const grossSalary = monthlyCTC;
      const deductionAmount = parseFloat(((absentDays / daysInMonth) * grossSalary).toFixed(2));
      const netSalary = Math.max(0, grossSalary - deductionAmount);

      totalGross += grossSalary;
      totalDeductions += deductionAmount;
      totalNet += netSalary;

      items.push({
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || 'General',
        grossSalary,
        totalDeductions: deductionAmount,
        netSalary,
        presentDays: Math.floor(effectivePresent),
        absentDays,
        leaveDays
      });
    }

    return {
      companyId,
      month: m,
      year: y,
      totalEmployees: employees.length,
      totalGross: parseFloat(totalGross.toFixed(2)),
      totalDeductions: parseFloat(totalDeductions.toFixed(2)),
      totalNet: parseFloat(totalNet.toFixed(2)),
      items
    };
  },

  /**
   * Process Payroll Run
   */
  async processPayroll({ companyId, month, year, processedBy }) {
    const preview = await this.previewPayroll({ companyId, month, year });

    const run = await prisma.payrollRun.upsert({
      where: {
        companyId_month_year: {
          companyId,
          month: preview.month,
          year: preview.year
        }
      },
      update: {
        status: 'PROCESSED',
        totalGross: preview.totalGross,
        totalDeductions: preview.totalDeductions,
        totalNet: preview.totalNet,
        processedBy,
        processedAt: new Date()
      },
      create: {
        companyId,
        month: preview.month,
        year: preview.year,
        status: 'PROCESSED',
        totalGross: preview.totalGross,
        totalDeductions: preview.totalDeductions,
        totalNet: preview.totalNet,
        processedBy,
        processedAt: new Date()
      }
    });

    await prisma.payrollItem.deleteMany({
      where: { payrollRunId: run.id }
    });

    for (const item of preview.items) {
      const pItem = await prisma.payrollItem.create({
        data: {
          payrollRunId: run.id,
          employeeId: item.employeeId,
          grossSalary: item.grossSalary,
          totalDeductions: item.totalDeductions,
          netSalary: item.netSalary,
          presentDays: item.presentDays,
          absentDays: item.absentDays,
          leaveDays: item.leaveDays
        }
      });

      const slipNumber = `SLIP-${preview.year}${String(preview.month).padStart(2, '0')}-${item.employeeCode}`;
      await prisma.salarySlip.upsert({
        where: { payrollItemId: pItem.id },
        update: {
          slipNumber,
          pdfUrl: `https://storage.googleapis.com/ems-slips/${slipNumber}.pdf`
        },
        create: {
          payrollItemId: pItem.id,
          slipNumber,
          pdfUrl: `https://storage.googleapis.com/ems-slips/${slipNumber}.pdf`
        }
      });
    }

    return this.getPayrollRunDetail(run.id);
  },

  /**
   * Approve Payroll Run
   */
  async approvePayroll({ payrollRunId, approvedBy }) {
    return prisma.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        status: 'APPROVED',
        updatedAt: new Date()
      },
      include: {
        items: {
          include: {
            employee: true,
            salarySlip: true
          }
        }
      }
    });
  },

  /**
   * List Payroll Runs
   */
  async listPayrollRuns(companyId, filters = {}) {
    const where = { companyId };
    if (filters.year) where.year = parseInt(filters.year, 10);
    if (filters.status) where.status = filters.status;

    return prisma.payrollRun.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
  },

  /**
   * Get Payroll Run Detail
   */
  async getPayrollRunDetail(id) {
    return prisma.payrollRun.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true, department: true }
            },
            salarySlip: true
          }
        }
      }
    });
  },

  /**
   * List Salary Slips
   */
  async listSalarySlips(companyId, filters = {}) {
    const where = {
      payrollItem: {
        payrollRun: { companyId }
      }
    };
    if (filters.employeeId) where.payrollItem.employeeId = filters.employeeId;
    if (filters.month) where.payrollItem.payrollRun.month = parseInt(filters.month, 10);
    if (filters.year) where.payrollItem.payrollRun.year = parseInt(filters.year, 10);

    return prisma.salarySlip.findMany({
      where,
      include: {
        payrollItem: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
            },
            payrollRun: true
          }
        }
      },
      orderBy: { generatedAt: 'desc' }
    });
  },

  /**
   * Payroll Stats
   */
  async getPayrollStats(companyId, dateRange = {}) {
    const runs = await prisma.payrollRun.findMany({
      where: { companyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 12
    });

    const totalRuns = runs.length;
    const totalDisbursed = runs
      .filter((r) => r.status === 'APPROVED' || r.status === 'PAID')
      .reduce((acc, r) => acc + Number(r.totalNet), 0);

    return {
      totalRuns,
      totalDisbursed: parseFloat(totalDisbursed.toFixed(2)),
      recentRuns: runs
    };
  },

  /**
   * Generate PDFs & Send Slips
   */
  async generateSalarySlipsPDF({ payrollRunId }) {
    const run = await this.getPayrollRunDetail(payrollRunId);
    if (!run) throw new Error('Payroll run not found');

    const generated = run.items.map((item) => ({
      employeeId: item.employeeId,
      slipNumber: item.salarySlip?.slipNumber,
      pdfUrl: item.salarySlip?.pdfUrl || `https://storage.googleapis.com/ems-slips/SLIP-${item.id}.pdf`
    }));

    return {
      payrollRunId,
      totalGenerated: generated.length,
      slips: generated
    };
  },

  async sendSalarySlips({ payrollRunId }) {
    const run = await this.getPayrollRunDetail(payrollRunId);
    if (!run) throw new Error('Payroll run not found');

    return {
      payrollRunId,
      queuedEmails: run.items.length,
      status: 'QUEUED'
    };
  }
};

export default payrollService;
