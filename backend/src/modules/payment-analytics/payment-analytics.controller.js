import * as analyticsService from './payment-analytics.service.js';

export async function getRevenueStats(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId : req.user?.companyId || req.user?.company?.id;
    const { startDate, endDate } = req.query;

    const data = await analyticsService.getRevenueStats({ companyId, startDate, endDate });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getMRR(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId : req.user?.companyId || req.user?.company?.id;

    const data = await analyticsService.getMRR({ companyId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getARR(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId : req.user?.companyId || req.user?.company?.id;

    const data = await analyticsService.getARR({ companyId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getChurnRate(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId : req.user?.companyId || req.user?.company?.id;

    const data = await analyticsService.getChurnRate({ companyId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentSuccessRate(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId : req.user?.companyId || req.user?.company?.id;

    const data = await analyticsService.getPaymentSuccessRate({ companyId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getRefundRate(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId : req.user?.companyId || req.user?.company?.id;

    const data = await analyticsService.getRefundRate({ companyId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentMethodStats(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId : req.user?.companyId || req.user?.company?.id;

    const data = await analyticsService.getPaymentMethodStats({ companyId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getRevenueByPlan(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId : req.user?.companyId || req.user?.company?.id;

    const data = await analyticsService.getRevenueByPlan({ companyId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export default {
  getRevenueStats,
  getMRR,
  getARR,
  getChurnRate,
  getPaymentSuccessRate,
  getRefundRate,
  getPaymentMethodStats,
  getRevenueByPlan,
};
