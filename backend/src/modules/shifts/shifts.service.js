import { prisma } from '../../config/prisma.js';

export const shiftsService = {
  async listShifts(arg1, arg2) {
    let companyId, filters = {};
    if (typeof arg1 === 'object' && arg1 !== null) {
      companyId = arg1.companyId;
      filters = arg1.filters || {};
    } else {
      companyId = arg1;
      filters = arg2 || {};
    }

    const where = { companyId };
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === 'true' || filters.isActive === true;
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        _count: {
          select: { shiftAssignments: true, rosters: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return shifts;
  },

  async getShiftById(id) {
    return prisma.shift.findUnique({
      where: { id },
      include: {
        shiftAssignments: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
            }
          }
        }
      }
    });
  },

  async createShift(companyIdOrData, maybeData) {
    const companyId = typeof companyIdOrData === 'object' ? companyIdOrData.companyId : companyIdOrData;
    const data = typeof companyIdOrData === 'object' ? companyIdOrData : (maybeData || {});
    return prisma.shift.create({
      data: {
        companyId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        graceMinutes: data.graceMinutes || 15,
        isNightShift: data.isNightShift || false,
        workingHours: data.workingHours || 8,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  },

  async updateShift(id, data) {
    return prisma.shift.update({
      where: { id },
      data
    });
  },

  async deleteShift(id) {
    return prisma.shift.delete({
      where: { id }
    });
  },

  async assignShift({ employeeIds = [], shiftId, effectiveFrom = new Date(), effectiveTo = null }) {
    const fromDate = new Date(effectiveFrom);
    const toDate = effectiveTo ? new Date(effectiveTo) : null;
    const results = [];

    for (const empId of employeeIds) {
      try {
        const assignment = await prisma.shiftAssignment.create({
          data: {
            employeeId: empId,
            shiftId,
            effectiveFrom: fromDate,
            effectiveTo: toDate
          }
        });
        results.push({ employeeId: empId, status: 'SUCCESS', assignmentId: assignment.id });
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

  async getShiftStats(companyId) {
    const [totalShifts, activeShifts, totalAssignments] = await Promise.all([
      prisma.shift.count({ where: { companyId } }),
      prisma.shift.count({ where: { companyId, isActive: true } }),
      prisma.shiftAssignment.count({ where: { shift: { companyId } } })
    ]);

    return {
      totalShifts,
      activeShifts,
      totalAssignments
    };
  },

  async getMyShift({ userId, companyId, email }) {
    let employee = null;

    if (userId) {
      employee = await prisma.employee.findFirst({
        where: {
          userId,
          ...(companyId ? { companyId } : {})
        },
        include: {
          department: { select: { name: true } },
          designation: { select: { name: true } }
        }
      });
    }

    if (!employee && email && companyId) {
      employee = await prisma.employee.findFirst({
        where: { email, companyId },
        include: {
          department: { select: { name: true } },
          designation: { select: { name: true } }
        }
      });
    }

    const now = new Date();

    if (employee) {
      const assignment = await prisma.shiftAssignment.findFirst({
        where: {
          employeeId: employee.id,
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: now } }
          ]
        },
        include: {
          shift: {
            include: {
              shiftBreakRules: {
                include: { breakRule: true }
              }
            }
          }
        },
        orderBy: { effectiveFrom: 'desc' }
      });

      if (assignment?.shift) {
        return {
          shift: assignment.shift,
          assignment,
          employee: {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            employeeCode: employee.employeeCode,
            department: employee.department?.name,
            designation: employee.designation?.name
          }
        };
      }
    }

    // Fallback to active default shift for the company
    const targetCompanyId = companyId || employee?.companyId;
    if (targetCompanyId) {
      const defaultShift = await prisma.shift.findFirst({
        where: {
          companyId: targetCompanyId,
          isActive: true
        },
        include: {
          shiftBreakRules: {
            include: { breakRule: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (defaultShift) {
        return {
          shift: defaultShift,
          assignment: null,
          employee: employee ? {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            employeeCode: employee.employeeCode
          } : null
        };
      }
    }

    return {
      shift: null,
      assignment: null,
      employee: null
    };
  }
};

export default shiftsService;
