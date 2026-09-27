import { prisma } from '../../config/prisma.js';

export const rostersService = {
  async listRosters(arg1, arg2, arg3) {
    let companyId, filters = {}, pagination = { page: 1, limit: 100 };

    if (typeof arg1 === 'object' && arg1 !== null) {
      companyId = arg1.companyId;
      filters = arg1.filters || {};
      if (arg1.pagination) {
        pagination = {
          page: parseInt(arg1.pagination.page, 10) || 1,
          limit: parseInt(arg1.pagination.limit, 10) || 100
        };
      }
    } else {
      companyId = arg1;
      filters = arg2 || {};
      if (arg3) {
        pagination = {
          page: parseInt(arg3.page, 10) || 1,
          limit: parseInt(arg3.limit, 10) || 100
        };
      }
    }

    console.log('=== LIST ROSTERS ===');
    console.log('Company ID:', companyId);

    if (!companyId) {
      return {
        rosters: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0
      };
    }

    const where = { companyId };

    if (filters.month && filters.year) {
      const m = parseInt(filters.month, 10);
      const y = parseInt(filters.year, 10);
      const startDate = new Date(Date.UTC(y, m - 1, 1));
      const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));
      where.date = { gte: startDate, lte: endDate };
    }

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.shiftId) where.shiftId = filters.shiftId;

    const [rosters, total] = await Promise.all([
      prisma.roster.findMany({
        where,
        include: {
          shift: {
            select: {
              id: true,
              name: true,
              startTime: true,
              endTime: true
            }
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: { select: { name: true } },
              designation: { select: { name: true } }
            }
          }
        },
        orderBy: { date: 'asc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.roster.count({ where })
    ]);

    console.log('Rosters found:', rosters.length);

    return {
      rosters,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit)
    };
  },

  async generateRoster(arg1, arg2) {
    let companyId, month, year, shiftId, employeeIds = [], shiftPattern = '5_2', createdBy;

    if (typeof arg1 === 'object' && arg1 !== null) {
      companyId = arg1.companyId;
      const data = arg1.data || arg1;
      month = parseInt(data.month, 10);
      year = parseInt(data.year, 10);
      shiftId = data.shiftId;
      employeeIds = data.employeeIds || [];
      shiftPattern = data.shiftPattern || data.pattern || '5_2';
      createdBy = arg1.createdBy || data.createdBy;
    } else {
      companyId = arg1;
      const data = arg2 || {};
      month = parseInt(data.month, 10);
      year = parseInt(data.year, 10);
      shiftId = data.shiftId;
      employeeIds = data.employeeIds || [];
      shiftPattern = data.shiftPattern || data.pattern || '5_2';
    }

    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();
    const daysInMonth = new Date(y, m, 0).getDate();

    let targetEmployees = employeeIds;
    if (!targetEmployees || targetEmployees.length === 0) {
      const allEmp = await prisma.employee.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { id: true }
      });
      targetEmployees = allEmp.map((e) => e.id);
    }

    // Ensure a valid shift exists
    let targetShift = null;
    if (shiftId) {
      targetShift = await prisma.shift.findUnique({ where: { id: shiftId } });
    }
    if (!targetShift) {
      targetShift = await prisma.shift.findFirst({
        where: { companyId, isActive: true },
        orderBy: { createdAt: 'asc' }
      });
    }
    if (!targetShift) {
      targetShift = await prisma.shift.create({
        data: {
          companyId,
          name: 'General Shift',
          startTime: '09:00',
          endTime: '18:00',
          workingHours: 8,
          isActive: true
        }
      });
    }

    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));

    const entries = [];
    for (const empId of targetEmployees) {
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(y, m - 1, day));
        const dayOfWeek = date.getUTCDay();

        // Work pattern logic
        if (shiftPattern === '5_2' && (dayOfWeek === 0 || dayOfWeek === 6)) {
          continue; // skip Sat/Sun
        } else if (shiftPattern === '6_1' && dayOfWeek === 0) {
          continue; // skip Sun
        }

        entries.push({
          companyId,
          employeeId: empId,
          shiftId: targetShift.id,
          date,
          isPublished: false
        });
      }
    }

    // Delete existing roster for target period & employees
    if (targetEmployees.length > 0) {
      await prisma.roster.deleteMany({
        where: {
          companyId,
          employeeId: { in: targetEmployees },
          date: { gte: startDate, lte: endDate }
        }
      });
    }

    // Batch insert new rosters
    let count = 0;
    if (entries.length > 0) {
      const res = await prisma.roster.createMany({
        data: entries,
        skipDuplicates: true
      });
      count = res.count;
    }

    // Audit log
    if (createdBy) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: createdBy,
            action: 'GENERATE',
            entity: 'Roster',
            newValues: {
              shiftId: targetShift.id,
              month: m,
              year: y,
              employeeCount: targetEmployees.length,
              entriesCreated: count
            }
          }
        });
      } catch (e) {
        // ignore audit log error if any
      }
    }

    return {
      success: true,
      month: m,
      year: y,
      shiftId: targetShift.id,
      totalGenerated: count,
      entriesCreated: count,
      employeesCount: targetEmployees.length
    };
  },

  async updateRoster(arg1, arg2) {
    let id, companyId, data = {}, updatedBy;
    if (typeof arg1 === 'object' && arg1 !== null) {
      id = arg1.id;
      companyId = arg1.companyId;
      data = arg1.data || {};
      updatedBy = arg1.updatedBy;
    } else {
      id = arg1;
      companyId = arg2?.companyId;
      data = arg2?.data || arg2 || {};
      updatedBy = arg2?.updatedBy;
    }

    const where = { id };
    if (companyId) where.companyId = companyId;

    const existing = await prisma.roster.findFirst({ where });
    if (!existing) {
      const error = new Error('Roster entry not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.shiftId && data.shiftId !== existing.shiftId) {
      const shiftWhere = { id: data.shiftId };
      if (companyId) shiftWhere.companyId = companyId;
      const shift = await prisma.shift.findFirst({ where: shiftWhere });
      if (!shift) {
        const error = new Error('Shift not found');
        error.statusCode = 400;
        throw error;
      }
    }

    const updated = await prisma.roster.update({
      where: { id },
      data: {
        shiftId: data.shiftId || existing.shiftId,
        date: data.date ? new Date(data.date) : existing.date,
        isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : existing.isPublished
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true }
        },
        shift: {
          select: { id: true, name: true, startTime: true, endTime: true }
        }
      }
    });

    if (updatedBy) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: updatedBy,
            action: 'UPDATE',
            entity: 'Roster',
            entityId: id,
            oldValues: { shiftId: existing.shiftId, date: existing.date, isPublished: existing.isPublished },
            newValues: { shiftId: updated.shiftId, date: updated.date, isPublished: updated.isPublished }
          }
        });
      } catch (e) {
        // ignore audit log failure
      }
    }

    return updated;
  },

  async deleteRoster(arg1, arg2) {
    let id, companyId, deletedBy;
    if (typeof arg1 === 'object' && arg1 !== null) {
      id = arg1.id;
      companyId = arg1.companyId;
      deletedBy = arg1.deletedBy;
    } else {
      id = arg1;
      companyId = arg2?.companyId;
      deletedBy = arg2?.deletedBy;
    }

    const where = { id };
    if (companyId) where.companyId = companyId;

    const existing = await prisma.roster.findFirst({ where });
    if (!existing) {
      const error = new Error('Roster entry not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.roster.delete({
      where: { id }
    });

    if (deletedBy) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: deletedBy,
            action: 'DELETE',
            entity: 'Roster',
            entityId: id,
            oldValues: { employeeId: existing.employeeId, date: existing.date, shiftId: existing.shiftId }
          }
        });
      } catch (e) {
        // ignore audit log failure
      }
    }

    return { success: true, message: 'Roster entry deleted successfully' };
  },

  async publishRoster(arg1, arg2) {
    let id, rosterId, companyId, month, year, publishedBy;
    if (typeof arg1 === 'object' && arg1 !== null) {
      id = arg1.id || arg1.rosterId;
      rosterId = arg1.rosterId || arg1.id;
      companyId = arg1.companyId;
      month = arg1.month;
      year = arg1.year;
      publishedBy = arg1.publishedBy;
    } else {
      id = arg1;
      rosterId = arg1;
      companyId = arg2?.companyId;
      publishedBy = arg2?.publishedBy;
    }

    const targetId = id || rosterId;

    if (targetId) {
      const where = { id: targetId };
      if (companyId) where.companyId = companyId;

      const existing = await prisma.roster.findFirst({ where });
      if (!existing) {
        const error = new Error('Roster entry not found');
        error.statusCode = 404;
        throw error;
      }

      const updated = await prisma.roster.update({
        where: { id: targetId },
        data: { isPublished: true },
        include: {
          employee: { select: { firstName: true, lastName: true, employeeCode: true } },
          shift: { select: { name: true, startTime: true, endTime: true } }
        }
      });

      if (publishedBy) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: publishedBy,
              action: 'PUBLISH',
              entity: 'Roster',
              entityId: targetId,
              oldValues: { isPublished: existing.isPublished },
              newValues: { isPublished: true }
            }
          });
        } catch (e) {}
      }

      return updated;
    }

    const where = {};
    if (companyId && month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      where.companyId = companyId;
      where.date = {
        gte: new Date(Date.UTC(y, m - 1, 1)),
        lte: new Date(Date.UTC(y, m, 0, 23, 59, 59))
      };
    } else if (companyId) {
      where.companyId = companyId;
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

  async getRosterCalendar(arg1, arg2, arg3) {
    let companyId, month, year, employeeId;
    if (typeof arg1 === 'object' && arg1 !== null) {
      companyId = arg1.companyId;
      month = arg1.month;
      year = arg1.year;
      employeeId = arg1.employeeId;
    } else {
      companyId = arg1;
      month = arg2;
      year = arg3;
    }

    const m = parseInt(month, 10) || (new Date().getMonth() + 1);
    const y = parseInt(year, 10) || new Date().getFullYear();
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));

    const where = {
      companyId,
      date: { gte: startDate, lte: endDate }
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const rosters = await prisma.roster.findMany({
      where,
      include: {
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true
          }
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
            designation: { select: { name: true } }
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    return {
      month: m,
      year: y,
      totalRosters: rosters.length,
      rosters,
      roster: rosters
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
