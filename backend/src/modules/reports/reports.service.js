import reportsRepository from './reports.repository.js';
import { REPORT_TYPES, EXPORT_FORMATS } from './reports.constants.js';
import { prisma } from '../../config/prisma.js';

function validateDateRange(from, to) {
  if (!from || !to) {
    throw new Error('Both "from" and "to" date parameters are required.');
  }
  const fromDate = new Date(from);
  let toDate = new Date(to);

  if (isNaN(fromDate.getTime())) {
    throw new Error('Invalid "from" date format.');
  }
  if (isNaN(toDate.getTime())) {
    throw new Error('Invalid "to" date format.');
  }

  if (typeof to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(to.trim())) {
    toDate = new Date(`${to.trim()}T23:59:59.999Z`);
  }

  if (fromDate > toDate) {
    throw new Error('"from" date must be earlier than or equal to "to" date.');
  }

  const maxRangeMs = 366 * 24 * 60 * 60 * 1000;
  if (toDate.getTime() - fromDate.getTime() > maxRangeMs) {
    throw new Error('Date range cannot exceed 1 year.');
  }

  return { fromDate, toDate };
}

export const reportsService = {
  async generateReport(type, companyId, filters = {}) {
    let rawData = [];

    switch (type) {
      case REPORT_TYPES.ATTENDANCE:
        rawData = await reportsRepository.getAttendanceReportData(companyId, filters);
        break;
      case REPORT_TYPES.PAYROLL:
        rawData = await reportsRepository.getPayrollReportData(companyId, filters);
        break;
      case REPORT_TYPES.EMPLOYEE:
        rawData = await reportsRepository.getEmployeeReportData(companyId, filters);
        break;
      case REPORT_TYPES.LEAVE:
        rawData = await reportsRepository.getLeaveReportData(companyId, filters);
        break;
      case REPORT_TYPES.OVERTIME:
        rawData = await reportsRepository.getOvertimeReportData(companyId, filters);
        break;
      case REPORT_TYPES.PERFORMANCE:
        rawData = await reportsRepository.getPerformanceReportData(companyId, filters);
        break;
      case REPORT_TYPES.PROJECT:
        rawData = await reportsRepository.getProjectReportData(companyId, filters);
        break;
      case REPORT_TYPES.CLIENT:
        rawData = await reportsRepository.getClientReportData(companyId, filters);
        break;
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }

    // Format into unified table rows
    const rows = this.formatRows(type, rawData);

    return {
      type,
      filters,
      totalRecords: rows.length,
      generatedAt: new Date().toISOString(),
      rows
    };
  },

  formatRows(type, data = []) {
    switch (type) {
      case REPORT_TYPES.ATTENDANCE:
        return data.map((item) => ({
          EmployeeCode: item.employee?.employeeCode || 'N/A',
          EmployeeName: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'N/A',
          Department: item.employee?.department?.name || 'N/A',
          Date: item.attendanceDate ? item.attendanceDate.toISOString().split('T')[0] : 'N/A',
          CheckIn: item.checkInAt ? new Date(item.checkInAt).toLocaleTimeString() : 'N/A',
          CheckOut: item.checkOutAt ? new Date(item.checkOutAt).toLocaleTimeString() : 'N/A',
          Method: item.attendanceMethod || 'MANUAL',
          WorkedMinutes: item.totalWorkedMinutes || 0,
          Status: item.status
        }));

      case REPORT_TYPES.EMPLOYEE:
        return data.map((item) => ({
          EmployeeCode: item.employeeCode || 'N/A',
          EmployeeName: `${item.firstName} ${item.lastName}`,
          Email: item.email,
          Phone: item.phone || 'N/A',
          Department: item.department?.name || 'N/A',
          Designation: item.designation?.name || 'N/A',
          Branch: item.branch?.name || 'N/A',
          JoiningDate: item.joiningDate ? item.joiningDate.toISOString().split('T')[0] : 'N/A',
          Status: item.status
        }));

      case REPORT_TYPES.LEAVE:
        return data.map((item) => ({
          EmployeeCode: item.employee?.employeeCode || 'N/A',
          EmployeeName: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'N/A',
          Department: item.employee?.department?.name || 'N/A',
          LeaveType: item.leaveType?.name || 'General',
          StartDate: item.startDate ? item.startDate.toISOString().split('T')[0] : 'N/A',
          EndDate: item.endDate ? item.endDate.toISOString().split('T')[0] : 'N/A',
          TotalDays: item.totalDays ? item.totalDays.toString() : '1',
          Status: item.status
        }));

      case REPORT_TYPES.PAYROLL:
        return data.map((run) => ({
          Period: `${run.month}/${run.year}`,
          TotalGross: run.totalGross ? `₹${run.totalGross}` : '₹0',
          TotalDeductions: run.totalDeductions ? `₹${run.totalDeductions}` : '₹0',
          TotalNet: run.totalNet ? `₹${run.totalNet}` : '₹0',
          Status: run.status
        }));

      case REPORT_TYPES.OVERTIME:
        return data.map((item) => ({
          EmployeeCode: item.employee?.employeeCode || 'N/A',
          EmployeeName: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'N/A',
          Date: item.date ? item.date.toISOString().split('T')[0] : 'N/A',
          Hours: item.hours ? item.hours.toString() : '0',
          Rate: item.rate ? item.rate.toString() : '1.5x',
          Status: item.status
        }));

      case REPORT_TYPES.PERFORMANCE:
        return data.map((item) => ({
          EmployeeCode: item.employee?.employeeCode || 'N/A',
          EmployeeName: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'N/A',
          ReviewCycle: item.cycle?.name || 'Annual Appraisal',
          Rating: item.score ? item.score.toString() : 'N/A',
          Status: item.status
        }));

      default:
        return data;
    }
  },

  async exportReport({ type, filters = {}, format = EXPORT_FORMATS.CSV, companyId, userId }) {
    const report = await this.generateReport(type, companyId, filters);

    const fileName = `${type.toLowerCase()}_report_${Date.now()}.${format.toLowerCase()}`;
    const fileUrl = `https://storage.googleapis.com/ems-reports/${fileName}`;

    const history = await reportsRepository.createReportHistory({
      companyId,
      userId,
      type,
      format,
      fileName,
      fileUrl,
      status: 'COMPLETED',
      filters
    });

    return {
      historyId: history.id,
      fileName,
      fileUrl,
      format,
      totalRows: report.totalRecords,
      data: report.rows
    };
  },

  async getReportStats(companyId) {
    const [attendanceCount, employeeCount, leaveCount, payrollCount] = await Promise.all([
      reportsRepository.getAttendanceReportData(companyId),
      reportsRepository.getEmployeeReportData(companyId),
      reportsRepository.getLeaveReportData(companyId),
      reportsRepository.getPayrollReportData(companyId)
    ]);

    return {
      totalAttendanceLogs: attendanceCount.length,
      totalEmployees: employeeCount.length,
      totalLeaves: leaveCount.length,
      totalPayrollRuns: payrollCount.length
    };
  },

  async getReportHistory(companyId, filters = {}) {
    return reportsRepository.getReportHistories(companyId, filters);
  },

  async getBreaksReport(companyId, query = {}) {
    const { from, to, employeeId, breakType, page = 1, limit = 50 } = query;
    const { fromDate, toDate } = validateDateRange(from, to);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const where = {
      employee: { companyId },
      breakStartAt: {
        gte: fromDate,
        lte: toDate
      }
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (breakType) {
      where.breakType = breakType;
    }

    const [total, breaks] = await Promise.all([
      prisma.attendanceBreak.count({ where }),
      prisma.attendanceBreak.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true
            }
          },
          attendanceLog: {
            select: {
              attendanceDate: true
            }
          }
        },
        orderBy: { breakStartAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      })
    ]);

    const formattedBreaks = breaks.map((b) => ({
      id: b.id,
      employee: {
        id: b.employee?.id || b.employeeId,
        name: b.employee ? `${b.employee.firstName} ${b.employee.lastName}`.trim() : 'N/A',
        code: b.employee?.employeeCode || 'N/A'
      },
      breakType: b.breakType || 'SHORT',
      breakStartAt: b.breakStartAt,
      breakEndAt: b.breakEndAt,
      totalBreakMinutes: b.totalBreakMinutes ?? (b.breakEndAt ? Math.round((new Date(b.breakEndAt) - new Date(b.breakStartAt)) / 60000) : 0),
      attendanceDate: b.attendanceLog?.attendanceDate
        ? (b.attendanceLog.attendanceDate instanceof Date
            ? b.attendanceLog.attendanceDate.toISOString().split('T')[0]
            : String(b.attendanceLog.attendanceDate).split('T')[0])
        : (b.breakStartAt instanceof Date
            ? b.breakStartAt.toISOString().split('T')[0]
            : String(b.breakStartAt).split('T')[0])
    }));

    return {
      breaks: formattedBreaks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  },

  async getBreaksSummary(companyId, query = {}) {
    const { from, to } = query;
    const { fromDate, toDate } = validateDateRange(from, to);

    const where = {
      employee: { companyId },
      breakStartAt: {
        gte: fromDate,
        lte: toDate
      }
    };

    const grouped = await prisma.attendanceBreak.groupBy({
      by: ['employeeId', 'breakType'],
      where,
      _count: {
        id: true
      },
      _sum: {
        totalBreakMinutes: true
      }
    });

    const employeeIds = [...new Set(grouped.map((g) => g.employeeId))];
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        companyId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true
      }
    });

    const empMap = new Map(employees.map((e) => [e.id, e]));
    const summaryMap = new Map();

    for (const row of grouped) {
      if (!summaryMap.has(row.employeeId)) {
        const emp = empMap.get(row.employeeId);
        summaryMap.set(row.employeeId, {
          employeeId: row.employeeId,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}`.trim() : 'Unknown',
          employeeCode: emp?.employeeCode || 'N/A',
          totalBreaks: 0,
          totalMinutes: 0,
          breakdown: {}
        });
      }

      const empSummary = summaryMap.get(row.employeeId);
      const type = row.breakType || 'SHORT';
      const count = row._count?.id || 0;
      const minutes = row._sum?.totalBreakMinutes || 0;

      empSummary.totalBreaks += count;
      empSummary.totalMinutes += minutes;
      empSummary.breakdown[type] = {
        count: (empSummary.breakdown[type]?.count || 0) + count,
        minutes: (empSummary.breakdown[type]?.minutes || 0) + minutes
      };
    }

    const summary = Array.from(summaryMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);

    return { summary };
  },

  async getEmployeeBreaksReport(companyId, employeeId, query = {}) {
    const emp = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      select: { id: true, firstName: true, lastName: true, employeeCode: true }
    });

    if (!emp) {
      const error = new Error('Employee not found in this company');
      error.statusCode = 404;
      throw error;
    }

    return this.getBreaksReport(companyId, { ...query, employeeId });
  }
};

export default reportsService;
