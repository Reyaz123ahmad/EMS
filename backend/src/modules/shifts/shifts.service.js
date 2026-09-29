import { prisma } from '../../config/prisma.js';
import { resolveShiftForEmployee, getEffectiveShiftOverview } from './services/shift-resolver.service.js';

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
