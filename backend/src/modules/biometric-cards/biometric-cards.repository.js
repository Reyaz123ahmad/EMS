import prisma from '../../config/prisma.js';

export const biometricCardsRepository = {
  findCardById: async (id) => {
    return prisma.employeeCard.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            photoUrl: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } }
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      }
    });
  },

  findCardByNumber: async (companyId, cardNumber) => {
    return prisma.employeeCard.findFirst({
      where: {
        companyId,
        cardNumber
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            status: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } }
          }
        }
      }
    });
  },

  findActiveCardByEmployee: async (employeeId) => {
    return prisma.employeeCard.findFirst({
      where: {
        employeeId,
        isActive: true
      },
      orderBy: { assignedAt: 'desc' }
    });
  },

  findCardsByEmployee: async (employeeId) => {
    return prisma.employeeCard.findMany({
      where: { employeeId },
      orderBy: { assignedAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  },

  findCardsByCompany: async (companyId, filters = {}, pagination = { page: 1, limit: 20 }) => {
    const where = { companyId };

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.cardType) where.cardType = filters.cardType;
    if (filters.search) {
      where.OR = [
        { cardNumber: { contains: filters.search, mode: 'insensitive' } },
        { employee: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { employee: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { employee: { employeeCode: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const [total, cards] = await Promise.all([
      prisma.employeeCard.count({ where }),
      prisma.employeeCard.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { assignedAt: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              email: true,
              photoUrl: true,
              department: { select: { name: true } },
              designation: { select: { name: true } }
            }
          }
        }
      })
    ]);

    return { total, page: pagination.page, limit: pagination.limit, cards };
  },

  countCompanyCards: async (companyId) => {
    return prisma.employeeCard.count({
      where: { companyId }
    });
  },

  createCard: async (data) => {
    return prisma.employeeCard.create({
      data,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  },

  updateCard: async (id, data) => {
    return prisma.employeeCard.update({
      where: { id },
      data,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  },

  deactivateCard: async (id, reason) => {
    return prisma.employeeCard.update({
      where: { id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: reason
      }
    });
  },

  regenerateQR: async (id, updateData) => {
    return prisma.employeeCard.update({
      where: { id },
      data: {
        ...updateData,
        regenerationCount: { increment: 1 }
      },
      include: {
        employee: true
      }
    });
  },

  createCardAuditLog: async (data) => {
    return prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        entity: 'EmployeeCard',
        entityId: data.cardId,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        ipAddress: data.ipAddress || null
      }
    });
  }
};
