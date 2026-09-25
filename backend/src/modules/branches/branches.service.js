import { prisma } from '../../config/prisma.js';
import { generateBranchCode } from '../../utils/id-generator.js';

export const branchesService = {
  async listBranches(companyId, filters = {}) {
    const where = {};
    if (companyId) where.companyId = companyId;
    if (filters.branchCode) {
      where.branchCode = { contains: filters.branchCode, mode: 'insensitive' };
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { branchCode: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    return prisma.branch.findMany({
      where,
      include: {
        _count: {
          select: { employees: true, biometricDevices: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getBranchById(idOrCode, companyId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    const where = isUuid
      ? { id: idOrCode }
      : (companyId ? { companyId_branchCode: { companyId, branchCode: idOrCode } } : { branchCode: idOrCode });

    return prisma.branch.findFirst({
      where: isUuid ? { id: idOrCode } : { branchCode: idOrCode, ...(companyId ? { companyId } : {}) },
      include: {
        employees: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, status: true }
        },
        biometricDevices: true
      }
    });
  },

  async findByIdOrCode(idOrCode, companyId) {
    return this.getBranchById(idOrCode, companyId);
  },

  async createBranch(companyId, data) {
    const branchCode = data.branchCode || (await generateBranchCode(companyId));
    return prisma.branch.create({
      data: {
        companyId,
        name: data.name,
        code: data.code || null,
        branchCode,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || 'India',
        pincode: data.pincode || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        geofenceRadius: data.geofenceRadius ? parseInt(data.geofenceRadius, 10) : 100,
        isGeofenceActive: data.isGeofenceActive !== undefined ? data.isGeofenceActive : true,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  },

  async updateBranch(id, data) {
    return prisma.branch.update({
      where: { id },
      data: {
        ...data,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
        geofenceRadius: data.geofenceRadius ? parseInt(data.geofenceRadius, 10) : undefined
      }
    });
  },

  async deleteBranch(id) {
    return prisma.branch.delete({
      where: { id }
    });
  },

  async bulkImportBranches(companyId, rows = []) {
    const created = [];
    for (const r of rows) {
      if (!r.name) continue;
      const b = await prisma.branch.create({
        data: {
          companyId,
          name: r.name,
          code: r.code || null,
          city: r.city || null,
          address: r.address || null,
          geofenceRadius: r.geofenceRadius ? parseInt(r.geofenceRadius, 10) : 100
        }
      });
      created.push(b);
    }
    return { count: created.length, branches: created };
  },

  async getBranchStats(companyId) {
    const total = await prisma.branch.count({ where: { companyId } });
    const active = await prisma.branch.count({ where: { companyId, isActive: true } });
    return { total, active };
  }
};

export default branchesService;
