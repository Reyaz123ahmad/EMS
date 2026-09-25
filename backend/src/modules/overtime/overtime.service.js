import { prisma } from '../../config/prisma.js';

export const overtimeService = {
  /**
   * Overtime Rules CRUD
   */
  async listRules(companyId) {
    return prisma.overtimeRule.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
  },

  async createRule(companyId, data) {
    return prisma.overtimeRule.create({
      data: {
        companyId,
        name: data.name,
        multiplier: parseFloat(data.multiplier || 1.5),
        minMinutes: data.minMinutes || 30,
        maxMinutesPerDay: data.maxMinutesPerDay || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  },

  async updateRule(id, data) {
    return prisma.overtimeRule.update({
      where: { id },
      data: {
        ...data,
        multiplier: data.multiplier !== undefined ? parseFloat(data.multiplier) : undefined
      }
    });
  },

  async deleteRule(id) {
    return prisma.overtimeRule.delete({
      where: { id }
    });
  },

  /**
   * Overtime Records
   */
  async listRecords(companyId, filters = {}) {
    const where = {
      employee: { companyId }
    };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;

    return prisma.overtimeRecord.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { date: 'desc' }
    });
  },

  /**
   * Calculate Overtime (Rule multiplier calculation)
   */
  async calculateOvertime({ employeeId, date, minutes }) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: true }
    });
    if (!employee) throw new Error('Employee not found');

    const rule = await prisma.overtimeRule.findFirst({
      where: { companyId: employee.companyId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    const multiplier = rule ? Number(rule.multiplier) : 1.5;
    const minMins = rule ? rule.minMinutes : 30;

    const applicableMinutes = minutes >= minMins ? minutes : 0;
    const overtimeHours = parseFloat((applicableMinutes / 60).toFixed(2));
    const effectivePayableHours = parseFloat((overtimeHours * multiplier).toFixed(2));

    return {
      employeeId,
      date,
      actualMinutes: minutes,
      applicableMinutes,
      multiplier,
      overtimeHours,
      effectivePayableHours
    };
  },

  /**
   * Overtime Requests (Apply, List, Approve, Reject, Bulk)
   */
  async applyOvertime({ employeeId, date, requestedMinutes, minutes, reason, companyId }) {
    const reqDate = new Date(date);
    reqDate.setUTCHours(0, 0, 0, 0);
    const totalMins = parseInt(requestedMinutes || minutes || 60, 10);

    return prisma.overtimeRequest.create({
      data: {
        employee: { connect: { id: employeeId } },
        date: reqDate,
        requestedMinutes: isNaN(totalMins) ? 60 : totalMins,
        reason: reason || null,
        status: 'PENDING'
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true }
        }
      }
    });
  },


  async listRequests(companyId, filters = {}) {
    const where = {
      employee: { companyId }
    };
    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    return prisma.overtimeRequest.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async approveRequest({ requestId, approvedBy }) {
    const req = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
      include: { employee: true }
    });
    if (!req) throw new Error('Overtime request not found');

    const updated = await prisma.$transaction(async (tx) => {
      const approvedReq = await tx.overtimeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedBy: approvedBy || 'ADMIN',
          approvedAt: new Date()
        }
      });

      const rule = await tx.overtimeRule.findFirst({
        where: { companyId: req.employee.companyId, isActive: true }
      });
      const multiplier = rule ? rule.multiplier : 1.5;

      await tx.overtimeRecord.create({
        data: {
          employeeId: req.employeeId,
          date: req.date,
          minutes: req.requestedMinutes,
          multiplier,
          status: 'APPROVED',
          approvedBy: approvedBy || 'ADMIN',
          approvedAt: new Date()
        }
      });

      return approvedReq;
    });

    return updated;
  },

  async rejectRequest({ requestId, approvedBy }) {
    return prisma.overtimeRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approvedBy: approvedBy || 'ADMIN',
        approvedAt: new Date()
      }
    });
  },

  async bulkApproveOvertime({ requestIds = [], approvedBy }) {
    const results = [];
    for (const id of requestIds) {
      try {
        const res = await this.approveRequest({ requestId: id, approvedBy });
        results.push({ id, status: 'SUCCESS', request: res });
      } catch (err) {
        results.push({ id, status: 'FAILED', error: err.message });
      }
    }
    return {
      total: requestIds.length,
      successCount: results.filter((r) => r.status === 'SUCCESS').length,
      failedCount: results.filter((r) => r.status === 'FAILED').length,
      results
    };
  },

  /**
   * Overtime Stats
   */
  async getOvertimeStats(companyId, dateRange = {}) {
    const records = await prisma.overtimeRecord.findMany({
      where: {
        employee: { companyId },
        status: 'APPROVED'
      }
    });

    const totalMinutes = records.reduce((acc, r) => acc + r.minutes, 0);
    const totalHours = parseFloat((totalMinutes / 60).toFixed(2));
    const totalRecords = records.length;

    const pendingRequests = await prisma.overtimeRequest.count({
      where: { employee: { companyId }, status: 'PENDING' }
    });

    return {
      totalRecords,
      totalMinutes,
      totalHours,
      pendingRequests,
      records
    };
  },

  /**
   * Overtime Report
   */
  async getOvertimeReport(companyId, filters = {}) {
    const where = {
      employee: { companyId }
    };
    if (filters.departmentId) where.employee.departmentId = filters.departmentId;

    const records = await prisma.overtimeRecord.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    return {
      total: records.length,
      records
    };
  }
};

export default overtimeService;
