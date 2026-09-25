import { prisma } from '../../config/prisma.js';

export const rostersService = {
  async listRosters(companyId, filters = {}) {
    const where = { companyId };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.shiftId) where.shiftId = filters.shiftId;
    if (filters.month && filters.year) {
      const m = parseInt(filters.month, 10);
      const y = parseInt(filters.year, 10);
      where.date = {
        gte: new Date(Date.UTC(y, m - 1, 1)),
        lte: new Date(Date.UTC(y, m, 0, 23, 59, 59))
      };
    }

    return prisma.roster.findMany({
      where,
      include: {
        shift: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { date: 'asc' }
    });
  },

  async generateRoster({ companyId, month, year, shiftId, employeeIds = [], skipWeekends = true }) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const daysInMonth = new Date(y, m, 0).getDate();

    let targetEmployees = employeeIds;
    if (!targetEmployees || targetEmployees.length === 0) {
      const allEmp = await prisma.employee.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { id: true }
      });
      targetEmployees = allEmp.map((e) => e.id);
    }

    const createdRosters = [];
    for (const empId of targetEmployees) {
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(y, m - 1, day));
        const dayOfWeek = date.getUTCDay();

        // 0 = Sunday, 6 = Saturday
        if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
          continue;
        }

        const r = await prisma.roster.upsert({
          where: {
            employeeId_date: {
              employeeId: empId,
              date
            }
          },
          update: {
            shiftId,
            isPublished: false
          },
          create: {
            companyId,
            employeeId: empId,
            shiftId,
            date,
            isPublished: false
          }
        });
        createdRosters.push(r);
      }
    }

    return {
      month: m,
      year: y,
      shiftId,
      totalGenerated: createdRosters.length,
      employeesCount: targetEmployees.length
    };
  },

  async publishRoster({ rosterId, companyId, month, year, publishedBy }) {
    const where = {};
    if (rosterId) {
      where.id = rosterId;
    } else if (companyId && month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      where.companyId = companyId;
      where.date = {
        gte: new Date(Date.UTC(y, m - 1, 1)),
        lte: new Date(Date.UTC(y, m, 0, 23, 59, 59))
      };
    }

    const updated = await prisma.roster.updateMany({
      where,
      data: { isPublished: true }
    });

    return {
      publishedCount: updated.count,
      isPublished: true
    };
  },

  async getRosterCalendar(companyId, month, year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));

    const rosters = await prisma.roster.findMany({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate }
      },
      include: {
        shift: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    return {
      month: m,
      year: y,
      totalRosters: rosters.length,
      rosters
    };
  },

  async bulkAssignRoster({ employeeIds = [], shiftId, dates = [], companyId }) {
    const results = [];
    for (const empId of employeeIds) {
      for (const d of dates) {
        const targetDate = new Date(d);
        targetDate.setUTCHours(0, 0, 0, 0);

        try {
          const r = await prisma.roster.upsert({
            where: {
              employeeId_date: {
                employeeId: empId,
                date: targetDate
              }
            },
            update: { shiftId },
            create: {
              companyId,
              employeeId: empId,
              shiftId,
              date: targetDate,
              isPublished: true
            }
          });
          results.push({ employeeId: empId, date: targetDate, status: 'SUCCESS', id: r.id });
        } catch (err) {
          results.push({ employeeId: empId, date: targetDate, status: 'FAILED', error: err.message });
        }
      }
    }

    return {
      total: results.length,
      successCount: results.filter((r) => r.status === 'SUCCESS').length,
      failedCount: results.filter((r) => r.status === 'FAILED').length,
      results
    };
  }
};

export default rostersService;
