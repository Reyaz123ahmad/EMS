import * as refundsService from './refunds.service.js';

export async function requestRefund(req, res, next) {
  try {
    const { paymentId, amount, reason, refundType, description } = req.body;
    const companyId = req.user?.companyId || req.user?.company?.id;
    const requestedBy = req.user?.id || 'ANONYMOUS';

    const refund = await refundsService.requestRefund({
      paymentId,
      companyId,
      requestedBy,
      amount,
      reason,
      refundType,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Refund request submitted successfully',
      data: refund,
    });
  } catch (err) {
    next(err);
  }
}

export async function approveRefund(req, res, next) {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const approvedBy = req.user?.id;

    const refund = await refundsService.approveRefund({
      refundId: id,
      adminNotes,
      approvedBy,
    });

    res.status(200).json({
      success: true,
      message: 'Refund request approved successfully',
      data: refund,
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectRefund(req, res, next) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const rejectedBy = req.user?.id;

    const refund = await refundsService.rejectRefund({
      refundId: id,
      rejectionReason,
      rejectedBy,
    });

    res.status(200).json({
      success: true,
      message: 'Refund request rejected',
      data: refund,
    });
  } catch (err) {
    next(err);
  }
}

export async function processRefund(req, res, next) {
  try {
    const { id } = req.params;
    const { speed } = req.body;
    const processedBy = req.user?.id;

    const refund = await refundsService.processRefund({
      refundId: id,
      speed,
      processedBy,
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully via payment gateway',
      data: refund,
    });
  } catch (err) {
    next(err);
  }
}

export async function systemIssueRefund(req, res, next) {
  try {
    const { paymentId, companyId, amount, description, reason } = req.body;
    const initiatedBy = req.user?.id;

    const refund = await refundsService.systemIssueRefund({
      paymentId,
      companyId,
      amount,
      description,
      reason,
      initiatedBy,
    });

    res.status(201).json({
      success: true,
      message: 'System refund issued and processed immediately',
      data: refund,
    });
  } catch (err) {
    next(err);
  }
}

export async function retryRefund(req, res, next) {
  try {
    const { id } = req.params;
    const processedBy = req.user?.id;

    const refund = await refundsService.retryRefund({
      refundId: id,
      processedBy,
    });

    res.status(200).json({
      success: true,
      message: 'Refund retry processed',
      data: refund,
    });
  } catch (err) {
    next(err);
  }
}

export async function listRefunds(req, res, next) {
  try {
    const companyId = req.user?.companyId || req.user?.company?.id;
    const { status, refundType, startDate, endDate, page, limit } = req.query;

    const result = await refundsService.listRefunds({
      companyId,
      filters: { status, refundType, startDate, endDate },
      pagination: { page, limit },
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function listAllRefunds(req, res, next) {
  try {
    const { status, refundType, companyId, startDate, endDate, page, limit } = req.query;

    const result = await refundsService.listAllRefunds({
      filters: { status, refundType, companyId, startDate, endDate },
      pagination: { page, limit },
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRefund(req, res, next) {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? null : req.user?.companyId || req.user?.company?.id;

    const refund = await refundsService.getRefundById({ id, companyId });

    res.status(200).json({
      success: true,
      data: refund,
    });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId : req.user?.companyId || req.user?.company?.id;

    const stats = await refundsService.getRefundStats({ companyId });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  requestRefund,
  approveRefund,
  rejectRefund,
  processRefund,
  systemIssueRefund,
  retryRefund,
  listRefunds,
  listAllRefunds,
  getRefund,
  getStats,
};
