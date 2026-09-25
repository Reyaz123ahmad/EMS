import { approvalsService } from './approvals.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const approvalsController = {
  async getWorkflows(req, res) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const workflows = await approvalsService.getWorkflows(companyId);
      return sendSuccess(res, workflows, 'Approval workflows retrieved successfully');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getWorkflowById(req, res) {
    try {
      const workflow = await approvalsService.getWorkflowById(req.params.id);
      if (!workflow) {
        return sendError(res, 'Workflow not found', 404);
      }
      return sendSuccess(res, workflow, 'Workflow details retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getWorkflowByEntityType(req, res) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const { entityType } = req.params;
      const workflow = await approvalsService.getWorkflowByEntityType(companyId, entityType);
      if (!workflow) {
        return sendError(res, 'Workflow not found for entity type', 404);
      }
      return sendSuccess(res, workflow, 'Workflow retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async createWorkflow(req, res) {
    try {
      const companyId = req.user?.companyId || req.body.companyId;
      const workflow = await approvalsService.createWorkflow({
        ...req.body,
        companyId,
      });
      return sendSuccess(res, workflow, 'Workflow created successfully', 201);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async updateWorkflow(req, res) {
    try {
      const workflow = await approvalsService.updateWorkflow(req.params.id, req.body);
      return sendSuccess(res, workflow, 'Workflow updated successfully');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async deleteWorkflow(req, res) {
    try {
      await approvalsService.deleteWorkflow(req.params.id);
      return sendSuccess(res, null, 'Workflow deleted successfully');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getRequests(req, res) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const requests = await approvalsService.getRequests(companyId, req.query);
      return sendSuccess(res, requests, 'Approval requests retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async createRequest(req, res) {
    try {
      const requestedBy = req.user?.employee?.id || req.user?.id || req.body.requestedBy;
      const request = await approvalsService.createApprovalRequest({
        ...req.body,
        requestedBy,
      });
      return sendSuccess(res, request, 'Approval request submitted', 201);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async actOnRequest(req, res) {
    try {
      const actedBy = req.user?.id || req.body.actedBy;
      const request = await approvalsService.actOnRequest({
        requestId: req.params.id,
        action: req.body.action,
        notes: req.body.notes,
        actedBy,
      });
      return sendSuccess(res, request, `Request ${req.body.action.toLowerCase()}ed successfully`);
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getPendingApprovals(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;
      const requests = await approvalsService.getPendingApprovals(userId, req.query);
      return sendSuccess(res, requests, 'Pending approvals retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getApprovalHistory(req, res) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const history = await approvalsService.getApprovalHistory(companyId, req.query);
      return sendSuccess(res, history, 'Approval history retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },

  async getApprovalStats(req, res) {
    try {
      const companyId = req.user?.companyId || req.query.companyId;
      const stats = await approvalsService.getApprovalStats(companyId);
      return sendSuccess(res, stats, 'Approval stats retrieved');
    } catch (err) {
      return sendError(res, err.message, 400);
    }
  },
};
