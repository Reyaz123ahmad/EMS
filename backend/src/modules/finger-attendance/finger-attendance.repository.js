import prisma from '../../config/prisma.js';

export const fingerAttendanceRepository = {
  findFingerEnrollment: async (employeeId, fingerIndex) => {
    return prisma.fingerEnrollment.findUnique({
      where: {
        employeeId_fingerIndex: {
          employeeId,
          fingerIndex: Number(fingerIndex)
        }
      }
    });
  },

  findFingerEnrollmentsByEmployee: async (employeeId) => {
    return prisma.fingerEnrollment.findMany({
      where: { employeeId, isActive: true },
      orderBy: { fingerIndex: 'asc' }
    });
  },

  findFingerEnrollmentsByDevice: async (deviceId) => {
    return prisma.fingerEnrollment.findMany({
      where: { deviceId, isActive: true }
    });
  },

  upsertFingerEnrollment: async ({
    companyId,
    employeeId,
    fingerIndex,
    templateData,
    templateFormat = 'ISO',
    deviceId,
    enrolledBy
  }) => {
    return prisma.fingerEnrollment.upsert({
      where: {
        employeeId_fingerIndex: {
          employeeId,
          fingerIndex: Number(fingerIndex)
        }
      },
      create: {
        companyId,
        employeeId,
        fingerIndex: Number(fingerIndex),
        templateData,
        templateFormat,
        deviceId: deviceId || null,
        enrolledBy: enrolledBy || null,
        isSynced: false,
        isActive: true
      },
      update: {
        templateData,
        templateFormat,
        deviceId: deviceId || null,
        enrolledBy: enrolledBy || null,
        isSynced: false,
        isActive: true,
        updatedAt: new Date()
      }
    });
  },

  deleteFingerEnrollment: async (employeeId, fingerIndex) => {
    return prisma.fingerEnrollment.updateMany({
      where: {
        employeeId,
        fingerIndex: Number(fingerIndex)
      },
      data: {
        isActive: false
      }
    });
  },

  updateSyncStatus: async (ids, isSynced = true) => {
    return prisma.fingerEnrollment.updateMany({
      where: { id: { in: ids } },
      data: {
        isSynced,
        syncedAt: isSynced ? new Date() : null
      }
    });
  },

  findFingerPunches: async (companyId, filters = {}, pagination = { page: 1, limit: 10 }) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      verification: 'FINGERPRINT'
    };

    if (filters.deviceId) where.deviceId = filters.deviceId;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    const [total, punches] = await Promise.all([
      prisma.devicePunch.count({ where }),
      prisma.devicePunch.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { punchedAt: 'desc' },
        include: {
          device: { select: { id: true, name: true, serialNumber: true } },
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } }
        }
      })
    ]);

    return {
      punches,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  countFingerStats: async (companyId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEnrollments, punchesToday, successfulPunchesToday] = await Promise.all([
      prisma.fingerEnrollment.count({ where: { companyId, isActive: true } }),
      prisma.devicePunch.count({
        where: {
          companyId,
          verification: 'FINGERPRINT',
          punchedAt: { gte: today }
        }
      }),
      prisma.devicePunch.count({
        where: {
          companyId,
          verification: 'FINGERPRINT',
          processed: true,
          punchedAt: { gte: today }
        }
      })
    ]);

    const successRate = punchesToday > 0 ? Math.round((successfulPunchesToday / punchesToday) * 100) : 100;

    return {
      totalEnrollments,
      punchesToday,
      successfulPunchesToday,
      successRate
    };
  }
};

export default fingerAttendanceRepository;
