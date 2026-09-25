import prisma from '../../config/prisma.js';

export const devicePunchesRepository = {
  createDevicePunch: async (data) => {
    return prisma.devicePunch.create({
      data,
      include: {
        device: {
          select: { id: true, name: true, serialNumber: true, branchId: true }
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } }
          }
        }
      }
    });
  },

  findPunchById: async (id) => {
    return prisma.devicePunch.findUnique({
      where: { id },
      include: {
        device: true,
        employee: {
          include: {
            branch: true,
            department: true
          }
        }
      }
    });
  },

  findPunchesByDevice: async (deviceId, pagination = { page: 1, limit: 20 }) => {
    const skip = (pagination.page - 1) * pagination.limit;
    const [total, punches] = await Promise.all([
      prisma.devicePunch.count({ where: { deviceId } }),
      prisma.devicePunch.findMany({
        where: { deviceId },
        skip,
        take: pagination.limit,
        orderBy: { punchedAt: 'desc' },
        include: {
          employee: {
            select: { id: true, employeeCode: true, firstName: true, lastName: true }
          }
        }
      })
    ]);

    return { total, page: pagination.page, limit: pagination.limit, punches };
  },

  findUnprocessedPunches: async (limit = 50) => {
    return prisma.devicePunch.findMany({
      where: { processed: false },
      take: limit,
      orderBy: { punchedAt: 'asc' },
      include: {
        device: true,
        employee: true
      }
    });
  },

  updatePunch: async (id, data) => {
    return prisma.devicePunch.update({
      where: { id },
      data,
      include: {
        employee: {
          select: { id: true, employeeCode: true, firstName: true, lastName: true }
        }
      }
    });
  },

  findPunchesByCompany: async (companyId, filters = {}, pagination = { page: 1, limit: 20 }) => {
    const where = { companyId };

    if (filters.deviceId) where.deviceId = filters.deviceId;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.processed !== undefined) where.processed = filters.processed;

    if (filters.startDate || filters.endDate) {
      where.punchedAt = {};
      if (filters.startDate) where.punchedAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.punchedAt.lte = new Date(filters.endDate);
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const [total, punches] = await Promise.all([
      prisma.devicePunch.count({ where }),
      prisma.devicePunch.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { punchedAt: 'desc' },
        include: {
          device: {
            select: { id: true, name: true, serialNumber: true }
          },
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } }
            }
          }
        }
      })
    ]);

    return { total, page: pagination.page, limit: pagination.limit, punches };
  },

  countPunchesStats: async (companyId, dateRange = {}) => {
    const where = { companyId };
    if (dateRange.startDate || dateRange.endDate) {
      where.punchedAt = {};
      if (dateRange.startDate) where.punchedAt.gte = new Date(dateRange.startDate);
      if (dateRange.endDate) where.punchedAt.lte = new Date(dateRange.endDate);
    }

    const [total, processed, unprocessed, failed] = await Promise.all([
      prisma.devicePunch.count({ where }),
      prisma.devicePunch.count({ where: { ...where, processed: true } }),
      prisma.devicePunch.count({ where: { ...where, processed: false, errorReason: null } }),
      prisma.devicePunch.count({ where: { ...where, errorReason: { not: null } } })
    ]);

    return { total, processed, unprocessed, failed };
  }
};
