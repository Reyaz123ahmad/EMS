import { prisma } from '../../config/prisma.js';

export const emergencyAttendanceService = {
  async getRequests(companyId, filters = {}) {
    const { status, employeeId, startDate, endDate } = filters;
    const where = {};

    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (companyId) {
      where.employee = { companyId };
    }
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return prisma.emergencyAttendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getRequestById(id) {
    return prisma.emergencyAttendance.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });
  },

  async createRequest(data) {
    return prisma.emergencyAttendance.create({
      data: {
        employeeId: data.employeeId,
        date: new Date(data.date),
        checkInTime: data.checkInTime ? new Date(data.checkInTime) : null,
        checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : null,
        reason: data.reason,
        status: 'PENDING',
      },
      include: {
        employee: true,
      },
    });
  },

  async approveRequest({ requestId, approvedBy }) {
    return prisma.emergencyAttendance.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        employee: true,
      },
    });
  },

  async rejectRequest({ requestId, reason, rejectedBy }) {
    return prisma.emergencyAttendance.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
      },
      include: {
        employee: true,
      },
    });
  },

  async bulkApproveEmergency({ requestIds, approvedBy }) {
    return prisma.emergencyAttendance.updateMany({
      where: {
        id: { in: requestIds },
        status: 'PENDING',
      },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
    });
  },

  async getEmergencyStats(companyId) {
    const where = companyId ? { employee: { companyId } } : {};

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.emergencyAttendance.count({ where }),
      prisma.emergencyAttendance.count({ where: { ...where, status: 'PENDING' } }),
      prisma.emergencyAttendance.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.emergencyAttendance.count({ where: { ...where, status: 'REJECTED' } }),
    ]);

    return {
      totalRequests: total,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
    };
  },
};
