import { prisma } from '../../config/prisma.js';

export const reportsRepository = {
  async getAttendanceReportData(companyId, filters = {}) {
    const where = { companyId };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.attendanceDate = {};
      if (filters.startDate) where.attendanceDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.attendanceDate.lte = new Date(filters.endDate);
    }

    return prisma.attendanceLog.findMany({
      where,
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, email: true, department: true }
        }
      },
      orderBy: { attendanceDate: 'desc' }
    });
  },

  async getPayrollReportData(companyId, filters = {}) {
    const where = { companyId };
    return prisma.payrollRun.findMany({
      where,
      include: {
        items: {
          include: {
            employee: {
              select: { firstName: true, lastName: true, employeeCode: true, department: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getEmployeeReportData(companyId, filters = {}) {
    const where = { companyId };
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.status) where.status = filters.status;

    return prisma.employee.findMany({
      where,
      include: {
        department: true,
        designation: true,
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getLeaveReportData(companyId, filters = {}) {
    const where = { employee: { companyId } };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;

    return prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getOvertimeReportData(companyId, filters = {}) {
    const where = { employee: { companyId } };
    return prisma.overtimeRecord.findMany({
      where,
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { date: 'desc' }
    });
  },

  async getPerformanceReportData(companyId, filters = {}) {
    const where = { employee: { companyId } };
    return prisma.performanceReview.findMany({
      where,
      include: {
        cycle: true,
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getProjectReportData(companyId, filters = {}) {
    return prisma.project.findMany({
      where: { companyId },
      include: {
        client: true,
        members: true,
        tasks: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getClientReportData(companyId, filters = {}) {
    return prisma.client.findMany({
      where: { companyId },
      include: {
        projects: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async createReportHistory(data) {
    return prisma.reportHistory.create({
      data
    });
  },

  async getReportHistories(companyId, filters = {}) {
    return prisma.reportHistory.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
  }
};

export default reportsRepository;
