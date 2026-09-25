import prisma from '../../config/prisma.js';

export const biometricDevicesRepository = {
  findDeviceById: async (id) => {
    return prisma.biometricDevice.findUnique({
      where: { id },
      include: {
        branch: {
          select: { id: true, name: true, code: true, city: true }
        },
        company: {
          select: { id: true, name: true }
        }
      }
    });
  },

  findDeviceBySerial: async (companyId, serialNumber) => {
    return prisma.biometricDevice.findFirst({
      where: {
        companyId,
        serialNumber
      }
    });
  },

  findDeviceByApiKey: async (apiKey) => {
    return prisma.biometricDevice.findUnique({
      where: { apiKey },
      include: {
        branch: true,
        company: {
          include: {
            subscription: {
              include: { plan: true }
            }
          }
        }
      }
    });
  },

  findDevicesByCompany: async (companyId, filters = {}, pagination = { page: 1, limit: 20 }) => {
    const where = { companyId };

    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.deviceType) where.deviceType = filters.deviceType;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { serialNumber: { contains: filters.search, mode: 'insensitive' } },
        { ipAddress: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const [total, devices] = await Promise.all([
      prisma.biometricDevice.count({ where }),
      prisma.biometricDevice.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: {
            select: { id: true, name: true, code: true }
          },
          _count: {
            select: { devicePunches: true }
          }
        }
      })
    ]);

    return { total, page: pagination.page, limit: pagination.limit, devices };
  },

  createDevice: async (data) => {
    return prisma.biometricDevice.create({
      data,
      include: {
        branch: {
          select: { id: true, name: true, code: true }
        }
      }
    });
  },

  updateDevice: async (id, data) => {
    return prisma.biometricDevice.update({
      where: { id },
      data,
      include: {
        branch: {
          select: { id: true, name: true, code: true }
        }
      }
    });
  },

  deactivateDevice: async (id) => {
    return prisma.biometricDevice.update({
      where: { id },
      data: {
        isActive: false,
        isOnline: false
      }
    });
  },

  regenerateApiKey: async (id, newApiKey) => {
    return prisma.biometricDevice.update({
      where: { id },
      data: {
        apiKey: newApiKey
      }
    });
  },

  updateHeartbeat: async (id) => {
    return prisma.biometricDevice.update({
      where: { id },
      data: {
        lastHeartbeat: new Date(),
        isOnline: true
      }
    });
  }
};
