import { prisma } from '../../config/prisma.js';

export const assetsService = {
  async getAssets(companyId, filters = {}) {
    const { category, condition, isActive, search, employeeId } = filters;
    const where = {};

    if (companyId) where.companyId = companyId;
    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (employeeId) {
      where.assignments = {
        some: {
          employeeId,
          returnedAt: null,
        },
      };
    }

    return prisma.asset.findMany({
      where,
      include: {
        assignments: {
          where: { returnedAt: null },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                email: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getAssetById(id) {
    return prisma.asset.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });
  },

  async createAsset(data) {
    return prisma.asset.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        code: data.code,
        category: data.category || 'General',
        description: data.description || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchasePrice: data.purchasePrice !== undefined ? data.purchasePrice : null,
        condition: data.condition || 'GOOD',
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  },

  async updateAsset(id, data) {
    const updateData = { ...data };
    if (updateData.purchaseDate) {
      updateData.purchaseDate = new Date(updateData.purchaseDate);
    }
    return prisma.asset.update({
      where: { id },
      data: updateData,
    });
  },

  async deleteAsset(id) {
    return prisma.asset.delete({
      where: { id },
    });
  },

  async assignAsset({ assetId, employeeId, condition, remarks, assignedBy }) {
    // Ensure asset is not currently assigned
    const activeAssignment = await prisma.assetAssignment.findFirst({
      where: { assetId, returnedAt: null },
    });

    if (activeAssignment) {
      throw new Error('Asset is currently assigned to another employee. Return it first.');
    }

    const assignment = await prisma.assetAssignment.create({
      data: {
        assetId,
        employeeId,
        condition: condition || 'GOOD',
        remarks: remarks || null,
        assignedAt: new Date(),
      },
      include: {
        employee: true,
        asset: true,
      },
    });

    if (condition) {
      await prisma.asset.update({
        where: { id: assetId },
        data: { condition },
      });
    }

    return assignment;
  },

  async returnAsset({ assetId, condition, remarks, returnedBy }) {
    const activeAssignment = await prisma.assetAssignment.findFirst({
      where: { assetId, returnedAt: null },
      orderBy: { assignedAt: 'desc' },
    });

    if (!activeAssignment) {
      throw new Error('No active assignment found for this asset.');
    }

    const updatedAssignment = await prisma.assetAssignment.update({
      where: { id: activeAssignment.id },
      data: {
        returnedAt: new Date(),
        condition: condition || activeAssignment.condition,
        remarks: remarks ? `${activeAssignment.remarks ? activeAssignment.remarks + ' | ' : ''}Returned: ${remarks}` : activeAssignment.remarks,
      },
      include: {
        employee: true,
        asset: true,
      },
    });

    if (condition) {
      await prisma.asset.update({
        where: { id: assetId },
        data: { condition },
      });
    }

    return updatedAssignment;
  },

  async getAssetHistory(assetId) {
    return prisma.assetAssignment.findMany({
      where: { assetId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  },

  async getEmployeeAssets(employeeId) {
    return prisma.assetAssignment.findMany({
      where: {
        employeeId,
        returnedAt: null,
      },
      include: {
        asset: true,
      },
      orderBy: { assignedAt: 'desc' },
    });
  },

  async getAssetStats(companyId) {
    const where = companyId ? { companyId } : {};

    const [total, active, assignments] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.count({ where: { ...where, isActive: true } }),
      prisma.assetAssignment.findMany({
        where: {
          asset: where,
          returnedAt: null,
        },
      }),
    ]);

    const assignedCount = assignments.length;
    const availableCount = Math.max(0, total - assignedCount);

    return {
      totalAssets: total,
      activeAssets: active,
      assignedAssets: assignedCount,
      availableAssets: availableCount,
    };
  },

  async bulkImportAssets({ assets, companyId }) {
    const results = [];
    for (const item of assets) {
      const created = await prisma.asset.upsert({
        where: {
          companyId_code: {
            companyId,
            code: item.code,
          },
        },
        update: {
          name: item.name,
          category: item.category || 'General',
          purchasePrice: item.purchasePrice || null,
          condition: item.condition || 'GOOD',
        },
        create: {
          companyId,
          name: item.name,
          code: item.code,
          category: item.category || 'General',
          purchasePrice: item.purchasePrice || null,
          condition: item.condition || 'GOOD',
          isActive: true,
        },
      });
      results.push(created);
    }
    return results;
  },

  async exportAssets(companyId, filters = {}) {
    const assets = await this.getAssets(companyId, filters);
    return assets.map((a) => ({
      ID: a.id,
      Code: a.code,
      Name: a.name,
      Category: a.category,
      Condition: a.condition,
      Price: a.purchasePrice,
      Status: a.assignments?.length > 0 ? 'Assigned' : 'Available',
      AssignedTo: a.assignments?.length > 0
        ? `${a.assignments[0].employee?.firstName} ${a.assignments[0].employee?.lastName} (${a.assignments[0].employee?.employeeCode})`
        : 'None',
      Active: a.isActive ? 'Yes' : 'No',
    }));
  },

  async getAssetCategories(companyId) {
    const assets = await prisma.asset.findMany({
      where: companyId ? { companyId } : {},
      select: { category: true },
      distinct: ['category'],
    });
    return assets.map((a) => a.category).filter(Boolean);
  },

  async createAssetCategory(companyId, data) {
    return {
      category: data.name,
      description: data.description,
      companyId,
    };
  },
};
