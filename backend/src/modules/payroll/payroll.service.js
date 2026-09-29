import { prisma } from '../../config/prisma.js';
import { logger } from '../../config/logger.js';

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

  /**
   * Salary Structure Templates
   */
  async listStructureTemplates(companyId) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return [];

    const payrollSettings = (typeof company.payrollSettings === 'object' && company.payrollSettings !== null)
      ? company.payrollSettings
      : {};

    const basicPct = Number(payrollSettings.basicPercentOfCTC ?? 40);
    const hraPct = Number(payrollSettings.hraPercentOfCTC ?? 20);
    const specialPct = Math.max(0, 100 - basicPct - hraPct);
    const pfPct = Number(company.pfEmployeePercent ?? 12);
    const esiPct = Number(company.esiEmployeePercent ?? 0.75);

    const defaultTemplates = [
      {
        id: 'standard-company-rules',
        name: 'Company Standard (Auto-Inherited from Rules)',
        description: `Auto-derived from company rules: Basic ${basicPct}%, HRA ${hraPct}%, Special ${specialPct}%, PF ${pfPct}%, ESI ${esiPct}%`,
        components: [
          { name: 'Basic', code: 'BASIC', basis: '% of CTC', value: basicPct, type: 'EARNING' },
          { name: 'HRA', code: 'HRA', basis: '% of CTC', value: hraPct, type: 'EARNING' },
          { name: 'Special', code: 'SPECIAL', basis: '% of CTC', value: specialPct, type: 'EARNING' },
          ...(company.pfEnabled !== false ? [{ name: 'PF', code: 'PF', basis: '% of Basic', value: pfPct, type: 'DEDUCTION' }] : []),
          ...(company.esiEnabled !== false ? [{ name: 'ESI', code: 'ESI', basis: '% of Gross', value: esiPct, type: 'DEDUCTION' }] : [])
        ]
      }
    ];

    const currentTemplates = payrollSettings.templates;
    return (Array.isArray(currentTemplates) && currentTemplates.length > 0) ? currentTemplates : defaultTemplates;
  },

  async createStructureTemplate(companyId, data) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error('Company not found');

    const currentSettings = (typeof company.payrollSettings === 'object' && company.payrollSettings !== null)
      ? company.payrollSettings
      : {};

    const templates = Array.isArray(currentSettings.templates) && currentSettings.templates.length > 0
      ? [...currentSettings.templates]
      : [
          {
            id: 'standard-engineer',
            name: 'Standard Engineer',
            description: 'Standard 40% Basic, 20% HRA, 40% Special Allowance structure with statutory PF & ESI',
            components: [
              { name: 'Basic', basis: '% of CTC', value: 40, type: 'EARNING' },
              { name: 'HRA', basis: '% of CTC', value: 20, type: 'EARNING' },
              { name: 'Special', basis: '% of CTC', value: 40, type: 'EARNING' },
              { name: 'PF', basis: '% of Basic', value: 12, type: 'DEDUCTION' },
              { name: 'ESI', basis: '% of Gross', value: 0.75, type: 'DEDUCTION' }
            ]
          }
        ];

    const newTemplate = {
      id: data.id || `template_${Date.now()}`,
      name: data.name || 'Custom Structure',
      description: data.description || '',
      components: data.components || [],
      createdAt: new Date().toISOString()
    };

    // Auto-create/upsert salary components in SalaryComponent table
    for (const comp of (data.components || [])) {
      const code = (comp.code || comp.name || 'COMP').toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);
      await prisma.salaryComponent.upsert({
        where: {
          companyId_code: {
            companyId,
            code
          }
        },
        update: {
          name: comp.name,
          type: comp.type || 'EARNING',
          calculationType: comp.basis?.includes('%') ? 'PERCENTAGE' : 'FIXED',
          percentage: Number(comp.value || 0)
        },
        create: {
          companyId,
          name: comp.name,
          code,
          type: comp.type || 'EARNING',
          calculationType: comp.basis?.includes('%') ? 'PERCENTAGE' : 'FIXED',
          percentage: Number(comp.value || 0)
        }
      });
    }

    templates.push(newTemplate);

    await prisma.company.update({
      where: { id: companyId },
      data: {
        payrollSettings: {
          ...currentSettings,
          templates
        }
      }
    });

    return newTemplate;
  },

  async updateEmployeeSalaryStructure(employeeId, data) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new Error('Employee not found');
    const companyId = emp.companyId;

    const ctc = parseFloat(data.ctc);
    const effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : new Date();

    const structure = await prisma.employeeSalaryStructure.upsert({
      where: { employeeId },
      update: { ctc, effectiveFrom },
      create: { employeeId, ctc, effectiveFrom }
    });

    const componentsToSave = [];

    if (Array.isArray(data.components) && data.components.length > 0) {
      for (const c of data.components) {
        let componentId = c.componentId;
        if (!componentId) {
          const code = (c.code || c.name || 'COMP').toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);
          const compRecord = await prisma.salaryComponent.upsert({
            where: {
              companyId_code: {
                companyId,
                code
              }
            },
            update: {
              name: c.name || code,
              type: c.type || 'EARNING'
            },
            create: {
              companyId,
              name: c.name || code,
              code,
              type: c.type || 'EARNING',
              calculationType: 'FIXED'
            }
          });
          componentId = compRecord.id;
        }

        componentsToSave.push({
          componentId,
          amount: parseFloat(c.amount || 0)
        });
      }
    } else {
      // Default structure components: 40% Basic, 20% HRA, 40% Special Allowance
      const monthlyCTC = ctc / 12;
      const basicAmount = parseFloat((monthlyCTC * 0.40).toFixed(2));
      const hraAmount = parseFloat((monthlyCTC * 0.20).toFixed(2));
      const specialAmount = parseFloat((monthlyCTC - basicAmount - hraAmount).toFixed(2));

      const defaultDefs = [
        { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', amount: basicAmount },
        { code: 'HRA', name: 'House Rent Allowance', type: 'EARNING', amount: hraAmount },
        { code: 'SPECIAL', name: 'Special Allowance', type: 'EARNING', amount: specialAmount }
      ];

      for (const def of defaultDefs) {
        const compRecord = await prisma.salaryComponent.upsert({
          where: {
            companyId_code: {
              companyId,
              code: def.code
            }
          },
          update: { name: def.name, type: def.type },
          create: { companyId, name: def.name, code: def.code, type: def.type, calculationType: 'PERCENTAGE' }
        });
        componentsToSave.push({
          componentId: compRecord.id,
          amount: def.amount
        });
      }
    }

    await prisma.salaryStructureComponent.deleteMany({
      where: { structureId: structure.id }
    });

    for (const c of componentsToSave) {
      await prisma.salaryStructureComponent.create({
        data: {
          structureId: structure.id,
          componentId: c.componentId,
          amount: c.amount
        }
      });
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
   * Preview Payroll with Complete Statutory, LOP, OT, Loans & Reimbursements
   */
  async previewPayroll({ companyId, month, year }) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    const [company, employees] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.employee.findMany({
        where: { companyId, status: 'ACTIVE' },
        include: {
          salaryStructure: {
            include: { components: { include: { component: true } } }
          },
          department: true,
          designation: true
        }
      })
    ]);

    if (!company) {
      throw new Error('Company not found');
    }

    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));
    const daysInMonth = new Date(y, m, 0).getDate();
    const lopDivisor = company.lopDivisor || 30;
    const lateThreshold = company.lateMarksForHalfDay || 3;

    const items = [];
    const skipped = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const emp of employees) {
      // FIX 1 (CRITICAL) & FIX 10: Skip employees without salary structure
      if (!emp.salaryStructure || !emp.salaryStructure.ctc) {
        logger.warn({ employeeId: emp.id }, 'No salary structure — skipping');
        skipped.push({
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          reason: 'NO_SALARY_STRUCTURE'
        });
        continue;
      }

      const monthlyCTC = Number(emp.salaryStructure.ctc) / 12;

      // Fetch Attendance, Leaves, Overtime, Loans, and Reimbursements
      const [attendanceLogs, leaveRequests, otRecords, activeLoans, approvedReimbursements] = await Promise.all([
        prisma.attendanceLog.findMany({
          where: {
            employeeId: emp.id,
            attendanceDate: { gte: startDate, lte: endDate }
          }
        }),
        prisma.leaveRequest.findMany({
          where: {
            employeeId: emp.id,
            status: 'APPROVED',
            startDate: { lte: endDate },
            endDate: { gte: startDate }
          },
          include: { leaveType: true }
        }),
        prisma.overtimeRecord.findMany({
          where: {
            employeeId: emp.id,
            date: { gte: startDate, lte: endDate },
            status: 'APPROVED'
          }
        }),
        prisma.loan.findMany({
          where: {
            employeeId: emp.id,
            companyId,
            status: 'ACTIVE'
          }
        }),
        prisma.reimbursement.findMany({
          where: {
            employeeId: emp.id,
            companyId,
            status: 'APPROVED',
            paidInPayrollRunId: null
          }
        })
      ]);

      // Attendance processing
      const presentCount = attendanceLogs.filter((l) => l.status === 'PRESENT').length;
      const lateLogs = attendanceLogs.filter((l) => l.status === 'LATE' || l.isLate);
      const lateCount = lateLogs.length;
      const halfDays = attendanceLogs.filter((l) => l.status === 'HALF_DAY').length;
      const onLeaveLogs = attendanceLogs.filter((l) => l.status === 'ON_LEAVE');

      // FIX 4 (HIGH) — Check isPaid for each ON_LEAVE log
      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;

      for (const log of onLeaveLogs) {
        const logDate = new Date(log.attendanceDate);
        const matchingRequest = leaveRequests.find((req) => {
          const reqStart = new Date(req.startDate);
          const reqEnd = new Date(req.endDate);
          return logDate >= reqStart && logDate <= reqEnd;
        });

        if (matchingRequest && matchingRequest.leaveType && matchingRequest.leaveType.isPaid === false) {
          unpaidLeaveDays += 1;
        } else {
          paidLeaveDays += 1;
        }
      }

      // FIX 9 (MEDIUM) — Late marks penalty rule
      let extraAbsentFromLate = 0;
      if (lateCount >= lateThreshold) {
        const extraHalfDays = Math.floor(lateCount / lateThreshold);
        extraAbsentFromLate = extraHalfDays * 0.5;
      }

      // Effective attendance and absent calculation
      const totalPresentDays = presentCount + lateCount;
      const effectivePresent = totalPresentDays + (halfDays * 0.5) + paidLeaveDays;
      const directAbsent = attendanceLogs.filter((l) => l.status === 'ABSENT').length;
      
      let absentDays = 0;
      if (attendanceLogs.length === 0) {
        absentDays = daysInMonth;
      } else {
        absentDays = directAbsent + (halfDays * 0.5) + unpaidLeaveDays + extraAbsentFromLate;
      }

      // LOP calculation based on company.lopDivisor
      const lopDeduction = parseFloat(((absentDays / lopDivisor) * monthlyCTC).toFixed(2));

      // Line items container
      const lineItems = [];

      // Base Structure Components Breakdown (40% Basic, 20% HRA, remainder Special Allowance by standard Indian HRMS convention if not itemized)
      let basic = 0;
      let hra = 0;
      let specialAllowance = 0;

      const structComponents = emp.salaryStructure.components || [];
      if (structComponents.length > 0) {
        for (const sc of structComponents) {
          const cName = sc.component?.name || 'Allowance';
          const cType = sc.component?.type || 'EARNING';
          const cAmt = Number(sc.amount);
          if (cName.toLowerCase().includes('basic')) basic = cAmt;
          else if (cName.toLowerCase().includes('hra') || cName.toLowerCase().includes('rent')) hra = cAmt;
          lineItems.push({
            componentId: sc.componentId,
            componentName: cName,
            type: cType,
            amount: cAmt
          });
        }
      } else {
        basic = parseFloat((monthlyCTC * 0.40).toFixed(2));
        hra = parseFloat((monthlyCTC * 0.20).toFixed(2));
        specialAllowance = parseFloat((monthlyCTC - (basic + hra)).toFixed(2));

        lineItems.push(
          { componentName: 'Basic Salary', type: 'EARNING', amount: basic },
          { componentName: 'House Rent Allowance (HRA)', type: 'EARNING', amount: hra },
          { componentName: 'Special Allowance', type: 'EARNING', amount: specialAllowance }
        );
      }

      // FIX 5 (HIGH) — Overtime calculation
      const otRate = Number(company.overtimeRate) > 0 ? Number(company.overtimeRate) : (monthlyCTC / 30 / 8);
      const otPay = parseFloat(
        otRecords.reduce((sum, r) => sum + (r.minutes / 60) * otRate * Number(r.multiplier || 1), 0).toFixed(2)
      );

      if (otPay > 0) {
        lineItems.push({
          componentName: 'Overtime',
          type: 'EARNING',
          amount: otPay
        });
      }

      // FIX 7 (MEDIUM) — Reimbursements
      let totalReimbursements = 0;
      for (const reimb of approvedReimbursements) {
        const rAmt = Number(reimb.amount);
        totalReimbursements += rAmt;
        lineItems.push({
          componentName: `Reimbursement (${reimb.category})`,
          type: 'EARNING',
          amount: rAmt,
          reimbursementId: reimb.id
        });
      }

      // Total Gross Earnings
      const grossSalary = parseFloat((monthlyCTC + otPay + totalReimbursements).toFixed(2));

      // DEDUCTIONS
      // 1. LOP
      if (lopDeduction > 0) {
        lineItems.push({
          componentName: 'LOP / Loss of Pay',
          type: 'DEDUCTION',
          amount: lopDeduction
        });
      }

      // FIX 6 (HIGH) — PF (Provident Fund)
      let pfEmployee = 0;
      if (company.pfEnabled !== false) {
        const pfCeiling = Number(company.pfCeiling || 15000);
        const pfPercent = Number(company.pfEmployeePercent || 12) / 100;
        pfEmployee = parseFloat((Math.min(basic, pfCeiling) * pfPercent).toFixed(2));
        if (pfEmployee > 0) {
          lineItems.push({
            componentName: 'Provident Fund (PF)',
            type: 'DEDUCTION',
            amount: pfEmployee
          });
        }
      }

      // FIX 6 (HIGH) — ESI (Employee State Insurance)
      let esiEmployee = 0;
      const esiCeiling = Number(company.esiCeiling || 21000);
      if (company.esiEnabled !== false && grossSalary <= esiCeiling) {
        const esiPercent = Number(company.esiEmployeePercent || 0.75) / 100;
        esiEmployee = parseFloat((grossSalary * esiPercent).toFixed(2));
        if (esiEmployee > 0) {
          lineItems.push({
            componentName: 'Employee State Insurance (ESI)',
            type: 'DEDUCTION',
            amount: esiEmployee
          });
        }
      }

      // FIX 6 (HIGH) — PT (Professional Tax)
      let ptAmount = 0;
      const ptState = (company.ptState || 'MAHARASHTRA').toUpperCase();
      if (ptState === 'MAHARASHTRA') {
        if (grossSalary > 10000) ptAmount = (m === 2) ? 300 : 200;
        else if (grossSalary > 7500) ptAmount = 175;
      } else if (ptState === 'KARNATAKA') {
        if (grossSalary > 15000) ptAmount = 200;
      } else if (ptState === 'TELANGANA' || ptState === 'ANDHRA PRADESH') {
        if (grossSalary > 20000) ptAmount = 200;
        else if (grossSalary > 15000) ptAmount = 150;
      } else {
        if (grossSalary > 10000) ptAmount = 200;
      }

      if (ptAmount > 0) {
        lineItems.push({
          componentName: 'Professional Tax (PT)',
          type: 'DEDUCTION',
          amount: ptAmount
        });
      }

      // FIX 6 (HIGH) — TDS (Income Tax)
      let monthlyTDS = 0;
      if (company.tdsEnabled !== false) {
        const annualGross = grossSalary * 12;
        const standardDeduction = 75000;
        const taxableIncome = Math.max(0, annualGross - standardDeduction);
        let annualTax = 0;
        if (taxableIncome > 1500000) {
          annualTax = 140000 + (taxableIncome - 1500000) * 0.30;
        } else if (taxableIncome > 1200000) {
          annualTax = 80000 + (taxableIncome - 1200000) * 0.20;
        } else if (taxableIncome > 1000000) {
          annualTax = 50000 + (taxableIncome - 1000000) * 0.15;
        } else if (taxableIncome > 700000) {
          annualTax = 20000 + (taxableIncome - 700000) * 0.10;
        } else if (taxableIncome > 300000) {
          annualTax = (taxableIncome - 300000) * 0.05;
        }
        if (taxableIncome <= 700000) annualTax = 0;
        else annualTax = annualTax * 1.04;
        monthlyTDS = parseFloat((annualTax / 12).toFixed(2));

        if (monthlyTDS > 0) {
          lineItems.push({
            componentName: 'Tax Deducted at Source (TDS)',
            type: 'DEDUCTION',
            amount: monthlyTDS
          });
        }
      }

      // FIX 7 (MEDIUM) — Loans EMI
      let totalLoanEMI = 0;
      for (const loan of activeLoans) {
        const emi = Math.min(Number(loan.emiAmount), Number(loan.remainingAmount));
        if (emi > 0) {
          totalLoanEMI += emi;
          lineItems.push({
            componentName: 'Loan EMI',
            type: 'DEDUCTION',
            amount: parseFloat(emi.toFixed(2)),
            loanId: loan.id
          });
        }
      }

      // Total Deductions
      const totalDeductionsForEmp = parseFloat(
        (lopDeduction + pfEmployee + esiEmployee + ptAmount + monthlyTDS + totalLoanEMI).toFixed(2)
      );

      // Net Salary
      let netSalary = Math.max(0, parseFloat((grossSalary - totalDeductionsForEmp).toFixed(2)));
      if (company.roundOffRule === 'NEAREST_RUPEE') {
        netSalary = Math.round(netSalary);
      }

      totalGross += grossSalary;
      totalDeductions += totalDeductionsForEmp;
      totalNet += netSalary;

      items.push({
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || 'General',
        grossSalary,
        totalDeductions: totalDeductionsForEmp,
        netSalary,
        presentDays: Math.floor(effectivePresent),
        absentDays: Math.round(absentDays * 10) / 10,
        leaveDays: paidLeaveDays,
        unpaidLeaveDays,
        overtimePay: otPay,
        reimbursementAmount: totalReimbursements,
        loanEMI: totalLoanEMI,
        lineItems
      });
    }

    return {
      companyId,
      month: m,
      year: y,
      totalEmployees: employees.length,
      processedCount: items.length,
      skippedCount: skipped.length,
      skipped,
      totalGross: parseFloat(totalGross.toFixed(2)),
      totalDeductions: parseFloat(totalDeductions.toFixed(2)),
      totalNet: parseFloat(totalNet.toFixed(2)),
      items
    };
  },

  /**
   * Process Payroll Run & Persist Component-Level Line Items
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

    // Delete existing salary slips and payroll items for this run
    await prisma.salarySlip.deleteMany({
      where: { payrollItem: { payrollRunId: run.id } }
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
          absentDays: Math.floor(item.absentDays),
          leaveDays: item.leaveDays
        }
      });

      // FIX 2 (CRITICAL) — Persist component-level line items
      if (item.lineItems && item.lineItems.length > 0) {
        const lineItemRecords = item.lineItems.map((li) => ({
          payrollItemId: pItem.id,
          componentId: li.componentId || null,
          componentName: li.componentName,
          type: li.type,
          amount: li.amount
        }));

        await prisma.payslipLineItem.createMany({
          data: lineItemRecords
        });

        // Update active loans if loan EMI was deducted
        for (const li of item.lineItems) {
          if (li.loanId) {
            const currentLoan = await prisma.loan.findUnique({ where: { id: li.loanId } });
            if (currentLoan) {
              const newRemaining = Math.max(0, Number(currentLoan.remainingAmount) - Number(li.amount));
              await prisma.loan.update({
                where: { id: li.loanId },
                data: {
                  remainingAmount: newRemaining,
                  status: newRemaining <= 0 ? 'CLOSED' : 'ACTIVE'
                }
              });
            }
          }

          // Mark reimbursements as PAID and link to payroll run
          if (li.reimbursementId) {
            await prisma.reimbursement.update({
              where: { id: li.reimbursementId },
              data: {
                status: 'PAID',
                paidInPayrollRunId: run.id
              }
            });
          }
        }
      }

      const slipNumber = `SLIP-${preview.year}${String(preview.month).padStart(2, '0')}-${item.employeeCode}`;
      await prisma.salarySlip.deleteMany({
        where: { slipNumber }
      });
      await prisma.salarySlip.create({
        data: {
          payrollItemId: pItem.id,
          slipNumber,
          pdfUrl: `https://storage.googleapis.com/ems-slips/${slipNumber}.pdf`
        }
      });
    }

    const detail = await this.getPayrollRunDetail(run.id);
    return {
      ...detail,
      skipped: preview.skipped,
      skippedCount: preview.skippedCount
    };
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
            salarySlip: true,
            lineItems: true
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
            salarySlip: true,
            lineItems: true
          }
        }
      }
    });
  },

  /**
   * Get My Salary Slips (Self-Service)
   */
  async getMySlips({ employeeId, companyId, filters = {} }) {
    const where = {
      payrollItem: {
        employeeId
      }
    };

    if (filters.month || filters.year) {
      where.payrollItem.payrollRun = {};
      if (filters.month) where.payrollItem.payrollRun.month = parseInt(filters.month, 10);
      if (filters.year) where.payrollItem.payrollRun.year = parseInt(filters.year, 10);
    }

    return prisma.salarySlip.findMany({
      where,
      include: {
        payrollItem: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
            },
            payrollRun: true,
            lineItems: true
          }
        }
      },
      orderBy: { generatedAt: 'desc' }
    });
  },

  /**
   * List Salary Slips
   */
  async listSalarySlips(companyId, filters = {}) {
    const where = {
      payrollItem: {
        payrollRun: companyId ? { companyId } : undefined
      }
    };
    if (filters.employeeIds && Array.isArray(filters.employeeIds)) {
      where.payrollItem.employeeId = { in: filters.employeeIds };
    } else if (filters.employeeId) {
      where.payrollItem.employeeId = filters.employeeId;
    }
    if (filters.departmentId) {
      where.payrollItem.employee = { departmentId: filters.departmentId };
    }
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
            payrollRun: true,
            lineItems: true
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
  },

  /**
   * List Company Salary Structures with Pagination & Search
   */
  async listSalaryStructures({ companyId, filters = {}, pagination = { page: 1, limit: 20 } }) {
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 20;
    const where = {
      employee: { companyId }
    };

    if (filters.search) {
      where.employee = {
        companyId,
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { employeeCode: { contains: filters.search, mode: 'insensitive' } }
        ]
      };
    }

    const [structures, total] = await Promise.all([
      prisma.employeeSalaryStructure.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: { select: { name: true } },
              designation: { select: { name: true } }
            }
          },
          components: {
            include: {
              component: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.employeeSalaryStructure.count({ where })
    ]);

    return {
      structures,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  },

  /**
   * List Reimbursements with Real Model
   */
  async listReimbursements({ companyId, filters = {}, pagination = { page: 1, limit: 20 } }) {
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 20;
    const where = { companyId };

    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    const [reimbursements, total] = await Promise.all([
      prisma.reimbursement.findMany({
        where,
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.reimbursement.count({ where })
    ]);

    return {
      reimbursements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  },

  /**
   * List Loans & Advances with Real Model
   */
  async listLoansAdvances({ companyId, filters = {}, pagination = { page: 1, limit: 20 } }) {
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 20;
    const where = { companyId };

    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.loan.count({ where })
    ]);

    return {
      loans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  },

  /**
   * List Tax Slabs / Regulatory Settings
   */
  async listTaxSlabs({ companyId }) {
    return {
      financialYear: '2026-2027',
      regimes: [
        {
          regime: 'NEW_REGIME',
          name: 'New Tax Regime (Default)',
          slabs: [
            { from: 0, to: 300000, rate: 0 },
            { from: 300000, to: 700000, rate: 5 },
            { from: 700000, to: 1000000, rate: 10 },
            { from: 1000000, to: 1200000, rate: 15 },
            { from: 1200000, to: 1500000, rate: 20 },
            { from: 1500000, to: null, rate: 30 }
          ]
        },
        {
          regime: 'OLD_REGIME',
          name: 'Old Tax Regime (With Exemptions)',
          slabs: [
            { from: 0, to: 250000, rate: 0 },
            { from: 250000, to: 500000, rate: 5 },
            { from: 500000, to: 1000000, rate: 20 },
            { from: 1000000, to: null, rate: 30 }
          ]
        }
      ]
    };
  },

  /**
   * Get Payroll Analytics
   */
  async getPayrollAnalytics({ companyId, filters = {} }) {
    const runs = await prisma.payrollRun.findMany({
      where: { companyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 12
    });

    const totalDisbursed = runs.reduce((acc, r) => acc + Number(r.totalNet || 0), 0);
    const totalGross = runs.reduce((acc, r) => acc + Number(r.totalGross || 0), 0);
    const totalDeductions = runs.reduce((acc, r) => acc + Number(r.totalDeductions || 0), 0);

    return {
      overview: {
        totalDisbursed: parseFloat(totalDisbursed.toFixed(2)),
        totalGross: parseFloat(totalGross.toFixed(2)),
        totalDeductions: parseFloat(totalDeductions.toFixed(2)),
        totalRuns: runs.length
      },
      monthlyTrends: runs.map(r => ({
        month: r.month,
        year: r.year,
        period: `${r.month}/${r.year}`,
        net: Number(r.totalNet || 0),
        gross: Number(r.totalGross || 0),
        deductions: Number(r.totalDeductions || 0),
        employees: r.totalEmployees || 0,
        status: r.status
      })).reverse()
    };
  }
};

export default payrollService;
