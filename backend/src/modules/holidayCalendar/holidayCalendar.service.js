import { prisma } from '../../config/prisma.js';

export const holidayCalendarService = {
  /**
   * Calendar CRUD
   */
  async listCalendars(companyId) {
    return prisma.holidayCalendar.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { holidays: true }
        }
      },
      orderBy: { year: 'desc' }
    });
  },

  async createCalendar(companyId, data) {
    return prisma.holidayCalendar.create({
      data: {
        companyId,
        name: data.name,
        year: parseInt(data.year, 10),
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  },

  async updateCalendar(id, data) {
    return prisma.holidayCalendar.update({
      where: { id },
      data: {
        ...data,
        year: data.year ? parseInt(data.year, 10) : undefined
      }
    });
  },

  async deleteCalendar(id) {
    return prisma.holidayCalendar.delete({
      where: { id }
    });
  },

  /**
   * Festival Holidays
   */
  async listHolidays(companyId, filters = {}) {
    const where = {};
    if (companyId) {
      where.calendar = { companyId };
    }
    if (filters.calendarId) where.calendarId = filters.calendarId;
    if (filters.year && !filters.month) {
      where.calendar = { ...where.calendar, year: parseInt(filters.year, 10) };
    }
    if (filters.month && filters.year) {
      const m = parseInt(filters.month, 10);
      const y = parseInt(filters.year, 10);
      const startDate = new Date(Date.UTC(y, m - 1, 1));
      const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));
      where.date = { gte: startDate, lte: endDate };
    } else if (filters.year) {
      const y = parseInt(filters.year, 10);
      const startDate = new Date(Date.UTC(y, 0, 1));
      const endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
      where.date = { gte: startDate, lte: endDate };
    }

    return prisma.festivalHoliday.findMany({
      where,
      include: {
        calendar: {
          select: { name: true, year: true, companyId: true }
        },
        _count: {
          select: { assignments: true }
        }
      },
      orderBy: { date: 'asc' }
    });
  },

  async createHoliday(calendarId, data, companyId) {
    let targetCalendarId = calendarId;
    if (!targetCalendarId) {
      const year = new Date(data.date).getFullYear();
      let cal = await prisma.holidayCalendar.findFirst({
        where: { companyId, year }
      });
      if (!cal) {
        cal = await prisma.holidayCalendar.create({
          data: {
            companyId,
            name: `${year} Annual Holiday Calendar`,
            year
          }
        });
      }
      targetCalendarId = cal.id;
    }

    const targetDate = new Date(data.date);
    targetDate.setUTCHours(0, 0, 0, 0);

    return prisma.festivalHoliday.create({
      data: {
        calendarId: targetCalendarId,
        name: data.name,
        date: targetDate,
        isMandatory: data.isMandatory !== undefined ? data.isMandatory : true,
        description: data.description || null
      }
    });
  },

  async updateHoliday(id, data) {
    return prisma.festivalHoliday.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined
      }
    });
  },

  async deleteHoliday(id) {
    return prisma.festivalHoliday.delete({
      where: { id }
    });
  },

  async bulkImportHolidays({ companyId, calendarId, year = new Date().getFullYear(), holidays = [], importedBy }) {
    let targetCalendarId = calendarId;
    const targetYear = parseInt(year, 10);

    if (!targetCalendarId) {
      let cal = await prisma.holidayCalendar.findFirst({
        where: { companyId, year: targetYear }
      });
      if (!cal) {
        cal = await prisma.holidayCalendar.create({
          data: {
            companyId,
            name: `${targetYear} Corporate Holidays`,
            year: targetYear
          }
        });
      }
      targetCalendarId = cal.id;
    }

    const created = [];
    for (const h of holidays) {
      const targetDate = new Date(h.date);
      targetDate.setUTCHours(0, 0, 0, 0);

      const holiday = await prisma.festivalHoliday.create({
        data: {
          calendarId: targetCalendarId,
          name: h.name,
          date: targetDate,
          isMandatory: h.isMandatory !== undefined ? h.isMandatory : true,
          description: h.description || null
        }
      });
      created.push(holiday);
    }

    return {
      calendarId: targetCalendarId,
      year: targetYear,
      importedCount: created.length,
      holidays: created
    };
  },

  async getHolidayCalendar(companyId, year = new Date().getFullYear()) {
    const targetYear = parseInt(year, 10);
    const calendar = await prisma.holidayCalendar.findFirst({
      where: { companyId, year: targetYear },
      include: {
        holidays: {
          orderBy: { date: 'asc' }
        }
      }
    });

    return {
      companyId,
      year: targetYear,
      calendar: calendar || { name: `${targetYear} Calendar`, holidays: [] }
    };
  },

  async assignHolidaysToEmployees({ holidayId, employeeIds = [] }) {
    const results = [];
    for (const empId of employeeIds) {
      try {
        const assignment = await prisma.festivalHolidayAssignment.create({
          data: {
            holidayId,
            employeeId: empId
          }
        });
        results.push({ employeeId: empId, status: 'SUCCESS', assignmentId: assignment.id });
      } catch (err) {
        results.push({ employeeId: empId, status: 'FAILED', error: err.message });
      }
    }

    return {
      holidayId,
      total: employeeIds.length,
      successCount: results.filter((r) => r.status === 'SUCCESS').length,
      failedCount: results.filter((r) => r.status === 'FAILED').length,
      results
    };
  }
};

export default holidayCalendarService;
