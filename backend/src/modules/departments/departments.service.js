import { prisma } from '../../config/prisma.js';
import { generateDepartmentCode } from '../../utils/id-generator.js';

export const departmentsService = {
  async listDepartments(companyId, filters = {}) {
    const where = {};
    if (companyId) where.companyId = companyId;
    if (filters.departmentCode) {
      where.departmentCode = { contains: filters.departmentCode, mode: 'insensitive' };
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { departmentCode: { contains: filters.departmentCode || filters.search, mode: 'insensitive' } }
      ];
    }
    return prisma.department.findMany({
      where,
      include: {
        parent: true,
        _count: {
          select: { employees: true, children: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  },

  async getDepartmentById(idOrCode, companyId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    const where = isUuid
      ? { id: idOrCode }
      : (companyId ? { companyId_departmentCode: { companyId, departmentCode: idOrCode } } : { departmentCode: idOrCode });

    return prisma.department.findFirst({
      where: isUuid ? { id: idOrCode } : { departmentCode: idOrCode, ...(companyId ? { companyId } : {}) },
      include: {
        parent: true,
        children: true,
        employees: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true }
        }
      }
    });
  },

  async findByIdOrCode(idOrCode, companyId) {
    return this.getDepartmentById(idOrCode, companyId);
  },

  async createDepartment(companyId, data) {
    const departmentCode = data.departmentCode || (await generateDepartmentCode(companyId));
    return prisma.department.create({
      data: {
        companyId,
        name: data.name,
        code: data.code || null,
        departmentCode,
        description: data.description || null,
        parentId: data.parentId || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  },

  async updateDepartment(id, data) {
    return prisma.department.update({
      where: { id },
      data: {
        ...data
      }
    });
  },

  async deleteDepartment(id) {
    return prisma.department.delete({
      where: { id }
    });
  },

  async bulkImportDepartments(companyId, rows = []) {
    const created = [];
    for (const r of rows) {
      if (!r.name) continue;
      const d = await prisma.department.create({
        data: {
          companyId,
          name: r.name,
          code: r.code || null,
          description: r.description || null
        }
      });
      created.push(d);
    }
    return { count: created.length, departments: created };
  },

  async getDepartmentStats(companyId) {
    const total = await prisma.department.count({ where: { companyId } });
    const active = await prisma.department.count({ where: { companyId, isActive: true } });
    return { total, active };
  }
};

export default departmentsService;
