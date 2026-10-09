import { prisma } from '../../config/prisma.js';
import { resolveShiftForEmployee, getEffectiveShiftOverview, calculateShiftDurationHours } from './services/shift-resolver.service.js';

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
        shiftBreakRules: {
          include: {
            breakRule: true
          }
        },
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
        shiftBreakRules: {
          include: {
            breakRule: true
          }
        },
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
    const isNight = Boolean(data.isNightShift || (data.endTime && data.startTime && data.endTime <= data.startTime));
    const computedHours = calculateShiftDurationHours(data.startTime, data.endTime, isNight);
    const breakRuleIds = Array.isArray(data.breakRuleIds) ? data.breakRuleIds.filter(Boolean) : [];

    return prisma.$transaction(async (tx) => {
      const shift = await tx.shift.create({
        data: {
          companyId,
          name: data.name,
          startTime: data.startTime,
          endTime: data.endTime,
          graceMinutes: data.graceMinutes !== undefined && data.graceMinutes !== null ? Number(data.graceMinutes) : 15,
          isNightShift: isNight,
          workingHours: data.workingHours !== undefined && data.workingHours !== null ? Number(data.workingHours) : computedHours,
          isActive: data.isActive !== undefined ? data.isActive : true
        }
      });

      if (breakRuleIds.length > 0) {
        await tx.shiftBreakRule.createMany({
          data: breakRuleIds.map((breakRuleId) => ({
            shiftId: shift.id,
            breakRuleId
          })),
          skipDuplicates: true
        });
      }

      return tx.shift.findUnique({
        where: { id: shift.id },
        include: {
          shiftBreakRules: {
            include: {
              breakRule: true
            }
          }
        }
      });
    });
  },

  async updateShift(id, data) {
    const { breakRuleIds, ...shiftFields } = data;

    return prisma.$transaction(async (tx) => {
      if (Object.keys(shiftFields).length > 0) {
        await tx.shift.update({
          where: { id },
          data: shiftFields
        });
      }

      if (Array.isArray(breakRuleIds)) {
        await tx.shiftBreakRule.deleteMany({
          where: { shiftId: id }
        });

        const validIds = breakRuleIds.filter(Boolean);
        if (validIds.length > 0) {
          await tx.shiftBreakRule.createMany({
            data: validIds.map((breakRuleId) => ({
              shiftId: id,
              breakRuleId
            })),
            skipDuplicates: true
          });
        }
      }

      return tx.shift.findUnique({
        where: { id },
        include: {
          shiftBreakRules: {
            include: {
              breakRule: true
            }
          }
        }
      });
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
        // Validate overlapping ShiftAssignment for the employee
        const overlapConditions = [
          // Case 1: Existing assignment is permanent (effectiveTo == null) and started on or before the new end date (or new is also permanent)
          {
            effectiveTo: null,
            ...(toDate ? { effectiveFrom: { lte: toDate } } : {})
          }
        ];

        // Case 2: Existing assignment has a finite date range that intersects [fromDate, toDate]
        if (toDate) {
          overlapConditions.push({
            effectiveFrom: { lte: toDate },
            effectiveTo: { gte: fromDate }
          });
        } else {
          overlapConditions.push({
            effectiveTo: { gte: fromDate }
          });
        }

        const existingOverlap = await prisma.shiftAssignment.findFirst({
          where: {
            employeeId: empId,
            OR: overlapConditions
          },
          include: { shift: { select: { name: true } } }
        });

        if (existingOverlap) {
          throw new Error(
            `Overlapping shift assignment found (${existingOverlap.shift?.name || 'Assigned Shift'}). Please remove or update existing assignment first.`
          );
        }

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

  async removeShiftAssignment(assignmentId, companyId) {
    const where = { id: assignmentId };
    if (companyId) {
      where.employee = { companyId };
    }

    const existing = await prisma.shiftAssignment.findFirst({ where });
    if (!existing) {
      return { success: true, message: 'Shift assignment not found or already removed' };
    }

    await prisma.shiftAssignment.delete({ where: { id: assignmentId } });
    return { success: true, message: 'Shift assignment removed successfully' };
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

    if (!employee) {
      const fallback = await resolveShiftForEmployee({ employeeId: null, companyId, date: new Date() });
      return {
        shift: fallback.shift,
        source: fallback.source,
        validTill: null,
        assignment: null,
        roster: null,
        employee: null
      };
    }

    const resolved = await resolveShiftForEmployee({
      employeeId: employee.id,
      companyId: companyId || employee.companyId,
      date: new Date()
    });

    return {
      shift: resolved.shift,
      source: resolved.source,
      validTill: resolved.validTill,
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeCode: employee.employeeCode,
        department: employee.department?.name,
        designation: employee.designation?.name
      }
    };
  },

  async getEffectiveShift(employeeId, companyId, date = new Date()) {
    return getEffectiveShiftOverview({ employeeId, companyId, date });
  }
};

export default shiftsService;
