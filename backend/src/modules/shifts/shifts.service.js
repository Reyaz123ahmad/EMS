import { prisma } from '../../config/prisma.js';

export const shiftsService = {
  async listShifts(companyId) {
    return prisma.shift.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { shiftAssignments: true, rosters: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
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

  async createShift(companyId, data) {
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
  }
};

export default shiftsService;
