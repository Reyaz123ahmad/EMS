import { prisma } from '../../config/prisma.js';

export const leaveService = {
  /**
   * Leave Types CRUD
   */
  async listLeaveTypes(companyId) {
    const compId = typeof companyId === 'object' ? companyId.companyId : companyId;
    return prisma.leaveType.findMany({
      where: { companyId: compId, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { leaveRequests: true }
        }
      }
    });
  },

  async getLeaveTypes({ companyId }) {
    const types = await prisma.leaveType.findMany({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { leaveRequests: true }
        }
      }
    });

    return {
      types,
      total: types.length
    };
  },

  async createLeaveType(arg1, arg2, arg3) {
    let companyId, data, createdBy;
    if (typeof arg1 === 'object' && arg1 !== null && !arg2) {
      companyId = arg1.companyId;
      data = arg1.data || arg1;
      createdBy = arg1.createdBy;
    } else {
      companyId = arg1;
      data = arg2;
      createdBy = arg3;
    }

    // Check duplicate name
    const existing = await prisma.leaveType.findFirst({
      where: {
        companyId,
        name: data.name
      }
    });

    if (existing) {
      const error = new Error('Leave type with this name already exists');
      error.statusCode = 409;
      throw error;
    }

    const type = await prisma.leaveType.create({
      data: {
        companyId,
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        maxDaysPerYear: data.maxDaysPerYear || data.daysAllowed || 12,
        isPaid: data.isPaid !== undefined ? data.isPaid : true,
        carryForward: data.carryForward !== undefined ? data.carryForward : false,
        maxCarryForward: data.maxCarryForward || data.maxCarryForwardDays || null,
        isActive: true
      }
    });

    if (createdBy) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: createdBy,
            action: 'CREATE',
            entity: 'LeaveType',
            entityId: type.id,
            newValues: { name: type.name, code: type.code }
          }
        });
      } catch (e) {
        // ignore audit log failure if any
      }
    }

    return type;
  },

  async updateLeaveType(arg1, arg2, arg3) {
    let id, companyId, data, updatedBy;
    if (typeof arg1 === 'object' && arg1 !== null && !arg2) {
      id = arg1.id;
      companyId = arg1.companyId;
      data = arg1.data || arg1;
      updatedBy = arg1.updatedBy;
    } else {
      id = arg1;
      data = arg2;
      companyId = arg3?.companyId;
      updatedBy = arg3?.updatedBy;
    }

    const whereClause = { id };
    if (companyId) whereClause.companyId = companyId;

    const existing = await prisma.leaveType.findFirst({
      where: whereClause
    });

    if (!existing) {
      const error = new Error('Leave type not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.leaveType.findFirst({
        where: {
          companyId: existing.companyId,
          name: data.name,
          id: { not: id }
        }
      });

      if (duplicate) {
        const error = new Error('Leave type with this name already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    const cleanData = {};
    if (data.name !== undefined) cleanData.name = data.name;
    if (data.code !== undefined) cleanData.code = data.code || null;
    if (data.description !== undefined) cleanData.description = data.description || null;
    if (data.maxDaysPerYear !== undefined) cleanData.maxDaysPerYear = data.maxDaysPerYear;
    else if (data.daysAllowed !== undefined) cleanData.maxDaysPerYear = data.daysAllowed;
    if (data.isPaid !== undefined) cleanData.isPaid = data.isPaid;
    if (data.carryForward !== undefined) cleanData.carryForward = data.carryForward;
    if (data.maxCarryForward !== undefined) cleanData.maxCarryForward = data.maxCarryForward;
    else if (data.maxCarryForwardDays !== undefined) cleanData.maxCarryForward = data.maxCarryForwardDays;
    if (data.isActive !== undefined) cleanData.isActive = data.isActive;

    const updated = await prisma.leaveType.update({
      where: { id },
      data: cleanData
    });

    if (updatedBy) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: updatedBy,
            action: 'UPDATE',
            entity: 'LeaveType',
            entityId: id,
            oldValues: { name: existing.name },
            newValues: { name: updated.name }
          }
        });
      } catch (e) {
        // ignore audit log error if any
      }
    }

    return updated;
  },

  async deleteLeaveType(id) {
    return prisma.leaveType.delete({
      where: { id }
    });
  },

  /**
   * Leave Balances
   */
  async getLeaveBalances(companyId, filters = {}) {
    const where = {
      employee: { companyId }
    };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.leaveTypeId) where.leaveTypeId = filters.leaveTypeId;
    if (filters.year) where.year = parseInt(filters.year, 10);

    return prisma.leaveBalance.findMany({
      where,
      include: {
        leaveType: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
        }
      },
      orderBy: { employee: { firstName: 'asc' } }
    });
  },

  async getEmployeeLeaveBalances(employeeId, year = new Date().getFullYear()) {
    return prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year: parseInt(year, 10)
      },
      include: { leaveType: true }
    });
  },

  /**
   * Apply Leave
   */
  async applyLeave({ employeeId, leaveTypeId, startDate, endDate, totalDays, reason, companyId }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const calculatedDays = totalDays || Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const year = start.getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year
        }
      }
    });

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays: calculatedDays,
        reason: reason || null,
        status: 'PENDING'
      },
      include: {
        leaveType: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
        }
      }
    });

    return {
      leaveRequest,
      balanceRemaining: balance ? Number(balance.remainingDays) : null
    };
  },

  /**
   * List Leave Requests
   */
  async listLeaveRequests(companyId, filters = {}) {
    const where = {
      employee: { companyId }
    };
    if (filters.status) where.status = filters.status;
    if (filters.leaveTypeId) where.leaveTypeId = filters.leaveTypeId;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    return prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
   * Approve Leave
   */
  async approveLeave({ requestId, approvedBy }) {
    const req = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { leaveType: true }
    });
    if (!req) {
      const error = new Error('Leave request not found');
      error.statusCode = 404;
      throw error;
    }

    const year = new Date(req.startDate).getFullYear();
    const days = Number(req.totalDays);

    const updated = await prisma.$transaction(async (tx) => {
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: req.employeeId,
            leaveTypeId: req.leaveTypeId,
            year
          }
        }
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            usedDays: { increment: days },
            remainingDays: { decrement: days }
          }
        });
      }

      return tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedBy: approvedBy || 'ADMIN',
          approvedAt: new Date()
        },
        include: { leaveType: true, employee: true }
      });
    });

    return updated;
  },

  /**
   * Reject Leave
   */
  async rejectLeave({ requestId, approvedBy, rejectionReason }) {
    const req = await prisma.leaveRequest.findUnique({
      where: { id: requestId }
    });
    if (!req) {
      const error = new Error('Leave request not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approvedBy: approvedBy || 'ADMIN',
        approvedAt: new Date(),
        rejectionReason: rejectionReason || 'Rejected by HR/Management'
      },
      include: { leaveType: true, employee: true }
    });
  },

  /**
   * Bulk Approve Leave
   */
  async bulkApproveLeave({ requestIds = [], approvedBy }) {
    const results = [];
    for (const id of requestIds) {
      try {
        const res = await this.approveLeave({ requestId: id, approvedBy });
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
   * Leave Calendar View
   */
  async getLeaveCalendar(companyId, month, year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));

    const requests = await prisma.leaveRequest.findMany({
      where: {
        employee: { companyId },
        status: 'APPROVED',
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } }
        ]
      },
      include: {
        leaveType: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      }
    });

    return {
      month: m,
      year: y,
      totalApprovedLeaves: requests.length,
      leaves: requests
    };
  },

  /**
   * Leave Balance Report
   */
  async getLeaveBalanceReport(companyId, filters = {}) {
    const where = {
      employee: { companyId }
    };
    if (filters.departmentId) where.employee.departmentId = filters.departmentId;
    if (filters.year) where.year = parseInt(filters.year, 10);

    const balances = await prisma.leaveBalance.findMany({
      where,
      include: {
        leaveType: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { employee: { firstName: 'asc' } }
    });

    return {
      total: balances.length,
      balances
    };
  },

  /**
   * Bulk Allocate Leaves
   */
  async bulkAllocateLeaves({ employeeIds = [], leaveTypeId, year = new Date().getFullYear(), days, allocatedBy, companyId }) {
    const results = [];
    const targetYear = parseInt(year, 10);
    const totalDays = parseFloat(days);

    for (const empId of employeeIds) {
      try {
        const balance = await prisma.leaveBalance.upsert({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: empId,
              leaveTypeId,
              year: targetYear
            }
          },
          update: {
            totalDays,
            remainingDays: totalDays
          },
          create: {
            employeeId: empId,
            leaveTypeId,
            year: targetYear,
            totalDays,
            usedDays: 0,
            remainingDays: totalDays
          }
        });
        results.push({ employeeId: empId, status: 'SUCCESS', balanceId: balance.id });
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
   * Carry Forward Leaves
   */
  async carryForwardLeaves({ companyId, fromYear, toYear, processedBy }) {
    const fYear = parseInt(fromYear, 10);
    const tYear = parseInt(toYear, 10);

    const balances = await prisma.leaveBalance.findMany({
      where: {
        employee: { companyId },
        year: fYear,
        leaveType: { carryForward: true }
      },
      include: { leaveType: true }
    });

    let carriedForwardCount = 0;
    for (const b of balances) {
      const remaining = Number(b.remainingDays);
      if (remaining <= 0) continue;

      const maxCarry = b.leaveType.maxCarryForward ? Number(b.leaveType.maxCarryForward) : remaining;
      const daysToCarry = Math.min(remaining, maxCarry);

      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: b.employeeId,
            leaveTypeId: b.leaveTypeId,
            year: tYear
          }
        },
        update: {
          totalDays: { increment: daysToCarry },
          remainingDays: { increment: daysToCarry }
        },
        create: {
          employeeId: b.employeeId,
          leaveTypeId: b.leaveTypeId,
          year: tYear,
          totalDays: (b.leaveType.maxDaysPerYear || 0) + daysToCarry,
          usedDays: 0,
          remainingDays: (b.leaveType.maxDaysPerYear || 0) + daysToCarry
        }
      });
      carriedForwardCount++;
    }

    return {
      companyId,
      fromYear: fYear,
      toYear: tYear,
      employeesProcessed: balances.length,
      carriedForwardCount
    };
  },

  /**
   * Leave Stats
   */
  async getLeaveStats(companyId, dateRange = {}) {
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();

    const [totalRequests, pendingRequests, approvedRequests, rejectedRequests] = await Promise.all([
      prisma.leaveRequest.count({ where: { employee: { companyId }, createdAt: { gte: startDate, lte: endDate } } }),
      prisma.leaveRequest.count({ where: { employee: { companyId }, status: 'PENDING' } }),
      prisma.leaveRequest.count({ where: { employee: { companyId }, status: 'APPROVED', createdAt: { gte: startDate, lte: endDate } } }),
      prisma.leaveRequest.count({ where: { employee: { companyId }, status: 'REJECTED', createdAt: { gte: startDate, lte: endDate } } })
    ]);

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests
    };
  },

  /**
   * Leave History with pagination and company filter
   */
  async getLeaveHistory({ employeeId, companyId, filters = {}, pagination = { page: 1, limit: 20 } }) {
    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (companyId) {
      where.employee = { companyId };
    }
    if (filters.status) where.status = filters.status;
    if (filters.year) {
      const y = parseInt(filters.year, 10);
      where.startDate = {
        gte: new Date(Date.UTC(y, 0, 1)),
        lte: new Date(Date.UTC(y, 11, 31, 23, 59, 59))
      };
    }

    const page = parseInt(pagination?.page, 10) || 1;
    const limit = parseInt(pagination?.limit, 10) || 20;

    const [history, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          leaveType: {
            select: { id: true, name: true, code: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.leaveRequest.count({ where })
    ]);

    return {
      leaves: history,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  /**
   * Employee Leave History
   */
  async getEmployeeLeaveHistory(employeeId, filters = {}) {
    const where = { employeeId };
    if (filters.status) where.status = filters.status;
    if (filters.year) {
      const y = parseInt(filters.year, 10);
      where.startDate = {
        gte: new Date(Date.UTC(y, 0, 1)),
        lte: new Date(Date.UTC(y, 11, 31, 23, 59, 59))
      };
    }

    return prisma.leaveRequest.findMany({
      where,
      include: { leaveType: true },
      orderBy: { createdAt: 'desc' }
    });
  }
};

export default leaveService;
