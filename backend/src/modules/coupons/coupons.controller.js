import * as couponsService from './coupons.service.js';

export async function createCoupon(req, res, next) {
  try {
    const createdBy = req.user?.id;
    const coupon = await couponsService.createCoupon({ data: req.body, createdBy });
    res.status(201).json({ success: true, message: 'Coupon created successfully', data: coupon });
  } catch (err) {
    next(err);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const coupon = await couponsService.updateCoupon({ id: req.params.id, data: req.body });
    res.status(200).json({ success: true, message: 'Coupon updated successfully', data: coupon });
  } catch (err) {
    next(err);
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    const coupon = await couponsService.deleteCoupon({ id: req.params.id });
    res.status(200).json({ success: true, message: 'Coupon deactivated successfully', data: coupon });
  } catch (err) {
    next(err);
  }
}

export async function listCoupons(req, res, next) {
  try {
    const { isActive, search, page, limit } = req.query;
    const isAct = isActive !== undefined ? isActive === 'true' : undefined;
    const result = await couponsService.listCoupons({
      filters: { isActive: isAct, search },
      pagination: { page, limit },
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function validateCoupon(req, res, next) {
  try {
    const { code, planId } = req.body;
    const result = await couponsService.validateCoupon({ code, planId });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function applyCoupon(req, res, next) {
  try {
    const { code, planId, companyId } = req.body;
    const cid = companyId || req.user?.companyId || req.user?.company?.id;
    const result = await couponsService.applyCoupon({ code, planId, companyId: cid });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    const stats = await couponsService.getStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export default {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  listCoupons,
  validateCoupon,
  applyCoupon,
  getStats,
};
