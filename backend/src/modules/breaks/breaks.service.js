import prisma from '../../config/prisma.js';

export const breaksService = {
  async listBreakRules(companyId, filters = {}) {
    const where = { companyId };
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === 'true' || filters.isActive === true;
    }

    return prisma.breakRule.findMany({
      where,
      include: {
        _count: {
          select: { shiftBreakRules: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getBreakRuleById(id, companyId) {
    const rule = await prisma.breakRule.findFirst({
      where: { id, companyId },
      include: {
        shiftBreakRules: {
          include: {
            shift: {
              select: { id: true, name: true, startTime: true, endTime: true, isActive: true }
            }
          }
        }
      }
    });

    if (!rule) {
      const error = new Error('Break rule not found');
      error.statusCode = 404;
      throw error;
    }

    return rule;
  },

  async createBreakRule(companyId, data) {
    return prisma.breakRule.create({
      data: {
        companyId,
        name: data.name.trim(),
        durationMinutes: Number(data.durationMinutes),
        maxPerShift: data.maxPerShift !== undefined ? Number(data.maxPerShift) : 1,
        isPaid: data.isPaid !== undefined ? Boolean(data.isPaid) : true,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
      }
    });
  },

  async updateBreakRule(id, companyId, data) {
    const existing = await prisma.breakRule.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      const error = new Error('Break rule not found');
      error.statusCode = 404;
      throw error;
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.durationMinutes !== undefined) updateData.durationMinutes = Number(data.durationMinutes);
    if (data.maxPerShift !== undefined) updateData.maxPerShift = Number(data.maxPerShift);
    if (data.isPaid !== undefined) updateData.isPaid = Boolean(data.isPaid);
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    return prisma.breakRule.update({
      where: { id },
      data: updateData
    });
  },

  async deleteBreakRule(id, companyId) {
    const existing = await prisma.breakRule.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      const error = new Error('Break rule not found');
      error.statusCode = 404;
      throw error;
    }

    // Soft delete rule by marking isActive: false
    return prisma.breakRule.update({
      where: { id },
      data: { isActive: false }
    });
  }
};

export default breaksService;
