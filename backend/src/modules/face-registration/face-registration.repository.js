import prisma from '../../config/prisma.js';

export const faceRegistrationRepository = {
  findEmployeeWithFace: async (employeeId) => {
    return prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        company: {
          select: { id: true, name: true }
        },
        branch: {
          select: { id: true, name: true }
        },
        department: {
          select: { id: true, name: true }
        },
        designation: {
          select: { id: true, name: true }
        }
      }
    });
  },

  findEmployeesWithFace: async (companyId, filters = {}, pagination = { page: 1, limit: 10 }) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      faceEmbedding: { not: null },
      faceRegisteredAt: { not: null }
    };

    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { employeeCode: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { faceRegisteredAt: 'desc' },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          photoUrl: true,
          facePhotoUrl: true,
          faceRegisteredAt: true,
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, name: true } }
        }
      })
    ]);

    return {
      employees,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  findEmployeesWithoutFace: async (companyId, filters = {}, pagination = { page: 1, limit: 10 }) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      status: 'ACTIVE',
      OR: [
        { faceEmbedding: null },
        { faceRegisteredAt: null }
      ]
    };

    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.search) {
      where.AND = [
        {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { employeeCode: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          photoUrl: true,
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, name: true } }
        }
      })
    ]);

    return {
      employees,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  updateEmployeeFace: async (employeeId, data) => {
    return prisma.employee.update({
      where: { id: employeeId },
      data: {
        faceEmbedding: data.faceEmbedding,
        facePhotoUrl: data.facePhotoUrl,
        facePhotoPublicId: data.facePhotoPublicId || null,
        faceRegisteredAt: data.faceRegisteredAt || new Date()
      }
    });
  },

  deleteEmployeeFace: async (employeeId) => {
    return prisma.employee.update({
      where: { id: employeeId },
      data: {
        faceEmbedding: null,
        facePhotoUrl: null,
        facePhotoPublicId: null,
        faceRegisteredAt: null
      }
    });
  },

  createFaceRegistrationLog: async (data) => {
    return prisma.faceRegistrationLog.create({
      data: {
        companyId: data.companyId,
        employeeId: data.employeeId,
        action: data.action,
        photoUrl: data.photoUrl || null,
        livenessScore: data.livenessScore || null,
        oldEmbedding: data.oldEmbedding || null,
        newEmbedding: data.newEmbedding || null,
        registeredBy: data.registeredBy || null,
        reason: data.reason || null,
        metadata: data.metadata || null
      }
    });
  },

  findFaceRegistrationLogs: async (companyId, filters = {}, pagination = { page: 1, limit: 10 }) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = { companyId };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.action) where.action = filters.action;

    const [total, logs] = await Promise.all([
      prisma.faceRegistrationLog.count({ where }),
      prisma.faceRegistrationLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  findAllFaceEmbeddings: async (companyId) => {
    return prisma.employee.findMany({
      where: {
        companyId,
        faceEmbedding: { not: null }
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        faceEmbedding: true,
        faceRegisteredAt: true
      }
    });
  },

  countFaceRegistrationStats: async (companyId) => {
    const [totalEmployees, registeredCount] = await Promise.all([
      prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.employee.count({
        where: {
          companyId,
          status: 'ACTIVE',
          faceEmbedding: { not: null },
          faceRegisteredAt: { not: null }
        }
      })
    ]);

    const pendingCount = Math.max(0, totalEmployees - registeredCount);
    const percentage = totalEmployees > 0 ? Math.round((registeredCount / totalEmployees) * 100) : 0;

    return {
      totalEmployees,
      registeredCount,
      pendingCount,
      percentage
    };
  }
};

export default faceRegistrationRepository;
