import prisma from '../../config/prisma.js';

export async function findCouponByCode(code) {
  return prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
}

export async function findCouponById(id) {
  return prisma.coupon.findUnique({
    where: { id },
  });
}

export async function findCoupons(filters = {}, pagination = { page: 1, limit: 20 }) {
  const { isActive, search } = filters;
  const where = {};

  if (typeof isActive === 'boolean') where.isActive = isActive;
  if (search) {
    where.code = { contains: search, mode: 'insensitive' };
  }

  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 20;
  const skip = (page - 1) * limit;

  const [total, coupons] = await Promise.all([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { total, page, limit, totalPages: Math.ceil(total / limit), coupons };
}

export async function createCoupon(data) {
  return prisma.coupon.create({
    data: {
      ...data,
      code: data.code.toUpperCase(),
    },
  });
}

export async function updateCoupon(id, data) {
  return prisma.coupon.update({
    where: { id },
    data,
  });
}

export async function deleteCoupon(id) {
  return prisma.coupon.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function incrementUsage(code) {
  return prisma.coupon.update({
    where: { code: code.toUpperCase() },
    data: {
      usedCount: { increment: 1 },
    },
  });
}

export async function getCouponStats() {
  const [total, active, totalRedemptions] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.coupon.aggregate({
      _sum: { usedCount: true },
    }),
  ]);

  return {
    totalCoupons: total,
    activeCoupons: active,
    totalRedemptions: totalRedemptions._sum.usedCount || 0,
  };
}

export default {
  findCouponByCode,
  findCouponById,
  findCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  incrementUsage,
  getCouponStats,
};
