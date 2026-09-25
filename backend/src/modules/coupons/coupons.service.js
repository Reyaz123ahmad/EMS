import prisma from '../../config/prisma.js';
import * as couponsRepo from './coupons.repository.js';
import dayjs from 'dayjs';

export async function createCoupon({ data, createdBy }) {
  const existing = await couponsRepo.findCouponByCode(data.code);
  if (existing) {
    const error = new Error(`Coupon with code ${data.code} already exists`);
    error.statusCode = 400;
    throw error;
  }

  return couponsRepo.createCoupon({
    ...data,
    createdBy,
  });
}

export async function updateCoupon({ id, data }) {
  const existing = await couponsRepo.findCouponById(id);
  if (!existing) {
    const error = new Error('Coupon not found');
    error.statusCode = 404;
    throw error;
  }

  return couponsRepo.updateCoupon(id, data);
}

export async function deleteCoupon({ id }) {
  const existing = await couponsRepo.findCouponById(id);
  if (!existing) {
    const error = new Error('Coupon not found');
    error.statusCode = 404;
    throw error;
  }

  return couponsRepo.deleteCoupon(id);
}

export async function listCoupons({ filters, pagination }) {
  return couponsRepo.findCoupons(filters, pagination);
}

export async function validateCoupon({ code, planId }) {
  const coupon = await couponsRepo.findCouponByCode(code);
  if (!coupon) {
    const error = new Error('Invalid discount coupon code');
    error.statusCode = 404;
    throw error;
  }

  if (!coupon.isActive) {
    const error = new Error('This coupon is no longer active');
    error.statusCode = 400;
    throw error;
  }

  const now = dayjs();
  if (now.isBefore(dayjs(coupon.validFrom)) || now.isAfter(dayjs(coupon.validTo))) {
    const error = new Error('This coupon has expired');
    error.statusCode = 400;
    throw error;
  }

  if (coupon.usedCount >= coupon.maxUses) {
    const error = new Error('This coupon has reached its maximum redemptions limit');
    error.statusCode = 400;
    throw error;
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    const error = new Error('Target plan not found');
    error.statusCode = 404;
    throw error;
  }

  const originalPrice = Number(plan.price);
  let discountAmount = 0;

  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = (originalPrice * Number(coupon.discountValue)) / 100;
  } else {
    discountAmount = Math.min(originalPrice, Number(coupon.discountValue));
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    originalPrice,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
  };
}

export async function applyCoupon({ code, planId, companyId }) {
  const validation = await validateCoupon({ code, planId, companyId });
  await couponsRepo.incrementUsage(code);

  return {
    applied: true,
    ...validation,
    message: `Coupon ${code} applied successfully!`,
  };
}

export async function getStats() {
  return couponsRepo.getCouponStats();
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
