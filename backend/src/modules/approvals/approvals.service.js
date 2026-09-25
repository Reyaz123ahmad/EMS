import { prisma } from '../../config/prisma.js';

export const approvalsService = {
  async getWorkflows(companyId) {
    const where = companyId ? { companyId } : {};
    return prisma.approvalWorkflow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { requests: true },
        },
      },
    });
  },

  async getWorkflowById(id) {
    return prisma.approvalWorkflow.findUnique({
      where: { id },
      include: { requests: true },
    });
  },

  async getWorkflowByEntityType(companyId, entityType) {
    return prisma.approvalWorkflow.findFirst({
      where: {
        companyId,
        entityType,
        isActive: true,
      },
    });
  },

  async createWorkflow(data) {
    return prisma.approvalWorkflow.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        entityType: data.entityType,
        levels: data.levels,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  },

  async updateWorkflow(id, data) {
    return prisma.approvalWorkflow.update({
      where: { id },
      data,
    });
  },

  async deleteWorkflow(id) {
    return prisma.approvalWorkflow.delete({
      where: { id },
    });
  },

  async getRequests(companyId, filters = {}) {
    const { status, entityType, requestedBy } = filters;
    const where = {};

    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (requestedBy) where.requestedBy = requestedBy;
    if (companyId) {
      where.workflow = { companyId };
    }

    return prisma.approvalRequest.findMany({
      where,
      include: {
        workflow: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createApprovalRequest(data) {
    return prisma.approvalRequest.create({
      data: {
        workflowId: data.workflowId,
        entityType: data.entityType,
        entityId: data.entityId,
        requestedBy: data.requestedBy,
        currentLevel: 1,
        status: 'PENDING',
      },
      include: {
        workflow: true,
      },
    });
  },

  async actOnRequest({ requestId, action, notes, actedBy }) {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { workflow: true },
    });

    if (!request) {
      throw new Error('Approval request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Request is already ${request.status}`);
    }

    const levels = Array.isArray(request.workflow?.levels)
      ? request.workflow.levels
      : JSON.parse(request.workflow?.levels || '[]');

    const totalLevels = Math.max(levels.length, 1);

    if (action === 'REJECT') {
      return prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
        },
        include: { workflow: true },
      });
    }

    if (action === 'APPROVE') {
      if (request.currentLevel < totalLevels) {
        return prisma.approvalRequest.update({
          where: { id: requestId },
          data: {
            currentLevel: request.currentLevel + 1,
          },
          include: { workflow: true },
        });
      } else {
        return prisma.approvalRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
          },
          include: { workflow: true },
        });
      }
    }

    throw new Error('Invalid action. Must be APPROVE or REJECT');
  },

  async getPendingApprovals(userId, filters = {}) {
    return prisma.approvalRequest.findMany({
      where: {
        status: 'PENDING',
        ...filters,
      },
      include: { workflow: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getApprovalHistory(companyId, filters = {}) {
    const { status, entityType } = filters;
    const where = {
      status: status ? status : { in: ['APPROVED', 'REJECTED', 'CANCELLED'] },
    };
    if (entityType) where.entityType = entityType;
    if (companyId) {
      where.workflow = { companyId };
    }

    return prisma.approvalRequest.findMany({
      where,
      include: { workflow: true },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getApprovalStats(companyId) {
    const where = companyId ? { workflow: { companyId } } : {};

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.approvalRequest.count({ where }),
      prisma.approvalRequest.count({ where: { ...where, status: 'PENDING' } }),
      prisma.approvalRequest.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.approvalRequest.count({ where: { ...where, status: 'REJECTED' } }),
    ]);

    const workflowsCount = await prisma.approvalWorkflow.count({
      where: companyId ? { companyId } : {},
    });

    return {
      totalRequests: total,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      totalWorkflows: workflowsCount,
    };
  },
};
