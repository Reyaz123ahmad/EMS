import * as clientPortalService from './client-portal.service.js';
import { getAuthClientId } from '../../security/data-scope.js';

export async function getDashboard(req, res, next) {
  try {
    const companyId = req.user?.companyId || req.user?.company?.id;
    const clientId = await getAuthClientId(req);
    const data = await clientPortalService.getClientDashboard({ clientId, companyId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getProjects(req, res, next) {
  try {
    const companyId = req.user?.companyId || req.user?.company?.id;
    const clientId = await getAuthClientId(req);
    const { status } = req.query;
    const data = await clientPortalService.getClientProjects({ clientId, companyId, filters: { status } });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getProjectDetail(req, res, next) {
  try {
    const companyId = req.user?.companyId || req.user?.company?.id;
    const clientId = await getAuthClientId(req);
    const { id } = req.params;
    const data = await clientPortalService.getClientProjectDetail({ clientId, projectId: id, companyId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createRequirement(req, res, next) {
  try {
    const clientId = await getAuthClientId(req);
    const { projectId, title, description, priority } = req.body;
    const data = await clientPortalService.createRequirement({
      clientId,
      projectId,
      data: { title, description, priority },
    });
    res.status(201).json({ success: true, message: 'Requirement submitted', data });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req, res, next) {
  try {
    const clientId = await getAuthClientId(req);
    const authorName = `${req.user?.firstName || 'Client'} ${req.user?.lastName || 'User'}`.trim();
    const { projectId, content } = req.body;
    const data = await clientPortalService.addComment({
      clientId,
      projectId,
      content,
      authorName,
    });
    res.status(201).json({ success: true, message: 'Comment posted', data });
  } catch (err) {
    next(err);
  }
}

export async function getInvoices(req, res, next) {
  try {
    const companyId = req.user?.companyId || req.user?.company?.id;
    const clientId = await getAuthClientId(req);
    const data = await clientPortalService.getClientInvoices({ clientId, companyId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getPayments(req, res, next) {
  try {
    const companyId = req.user?.companyId || req.user?.company?.id;
    const clientId = await getAuthClientId(req);
    const data = await clientPortalService.getClientPaymentHistory({ clientId, companyId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export default {
  getDashboard,
  getProjects,
  getProjectDetail,
  createRequirement,
  addComment,
  getInvoices,
  getPayments,
};
