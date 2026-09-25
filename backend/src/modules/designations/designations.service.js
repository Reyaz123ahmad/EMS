import { prisma } from '../../config/prisma.js';
import { generateDesignationCode } from '../../utils/id-generator.js';

export const designationsService = {
  async listDesignations(companyId, filters = {}) {
    const where = {};
    if (companyId) where.companyId = companyId;
    if (filters.designationCode) {
      where.designationCode = { contains: filters.designationCode, mode: 'insensitive' };
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { designationCode: { contains: filters.designationCode || filters.search, mode: 'insensitive' } }
      ];
    }
    return prisma.designation.findMany({
      where,
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  },

  async getDesignationById(idOrCode, companyId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    const where = isUuid
      ? { id: idOrCode }
      : (companyId ? { companyId_designationCode: { companyId, designationCode: idOrCode } } : { designationCode: idOrCode });

    return prisma.designation.findFirst({
      where: isUuid ? { id: idOrCode } : { designationCode: idOrCode, ...(companyId ? { companyId } : {}) },
      include: {
        employees: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      }
    });
  },

  async findByIdOrCode(idOrCode, companyId) {
    return this.getDesignationById(idOrCode, companyId);
  },

  async createDesignation(companyId, data) {
    const designationCode = data.designationCode || (await generateDesignationCode(companyId));
    return prisma.designation.create({
      data: {
        companyId,
        name: data.name,
        code: data.code || null,
        designationCode,
        level: data.level ? parseInt(data.level, 10) : 1,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  },

  async updateDesignation(id, data) {
    return prisma.designation.update({
      where: { id },
      data: {
        ...data,
        level: data.level ? parseInt(data.level, 10) : undefined
      }
    });
  },

  async deleteDesignation(id) {
    return prisma.designation.delete({
      where: { id }
    });
  },

  async bulkImportDesignations(companyId, rows = []) {
    const created = [];
    for (const r of rows) {
      if (!r.name) continue;
      const d = await prisma.designation.create({
        data: {
          companyId,
          name: r.name,
          code: r.code || null,
          level: r.level ? parseInt(r.level, 10) : 1,
          description: r.description || null
        }
      });
      created.push(d);
    }
    return { count: created.length, designations: created };
  },

  async getDesignationStats(companyId) {
    const total = await prisma.designation.count({ where: { companyId } });
    const active = await prisma.designation.count({ where: { companyId, isActive: true } });
    return { total, active };
  }
};

export default designationsService;
