import prisma from '../../config/prisma.js';
import dayjs from 'dayjs';

export async function getRevenueStats({ companyId, startDate, endDate }) {
  const where = { status: 'SUCCESS' };
  if (companyId) {
    where.subscription = { companyId };
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const payments = await prisma.paymentTransaction.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const monthlyRevenue = payments
    .filter((p) => dayjs(p.createdAt).isAfter(dayjs().subtract(30, 'day')))
    .reduce((acc, p) => acc + Number(p.amount), 0);

  // Group by day for charts
  const dailyMap = {};
  payments.forEach((p) => {
    const date = dayjs(p.createdAt).format('YYYY-MM-DD');
    dailyMap[date] = (dailyMap[date] || 0) + Number(p.amount);
  });

  const trend = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));

  return {
    totalRevenue,
    monthlyRevenue,
    paymentCount: payments.length,
    trend,
  };
}

export async function getMRR({ companyId }) {
  const where = { status: 'ACTIVE' };
  if (companyId) where.companyId = companyId;

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: { plan: true },
  });

  const mrr = subscriptions.reduce((acc, sub) => {
    const price = Number(sub.plan?.price || 0);
    const cycle = sub.plan?.billingCycle || 'monthly';
    const monthlyNormalized = cycle === 'yearly' ? price / 12 : price;
    return acc + monthlyNormalized;
  }, 0);

  return {
    mrr: Math.round(mrr * 100) / 100,
    activeSubscribers: subscriptions.length,
    currency: 'INR',
  };
}

export async function getARR({ companyId }) {
  const { mrr, activeSubscribers } = await getMRR({ companyId });
  const arr = mrr * 12;

  return {
    arr: Math.round(arr * 100) / 100,
    mrr,
    activeSubscribers,
    currency: 'INR',
  };
}

export async function getChurnRate({ companyId }) {
  const whereTotal = companyId ? { companyId } : {};
  const [total, cancelled, expired] = await Promise.all([
    prisma.subscription.count({ where: whereTotal }),
    prisma.subscription.count({ where: { ...whereTotal, status: 'CANCELLED' } }),
    prisma.subscription.count({ where: { ...whereTotal, status: 'EXPIRED' } }),
  ]);

  const churned = cancelled + expired;
  const churnRate = total > 0 ? Math.round((churned / total) * 10000) / 100 : 0;

  return {
    totalSubscriptions: total,
    cancelled,
    expired,
    churnedTotal: churned,
    churnRatePercentage: churnRate,
  };
}

export async function getPaymentSuccessRate({ companyId }) {
  const where = {};
  if (companyId) {
    where.subscription = { companyId };
  }

  const [total, success, failed] = await Promise.all([
    prisma.paymentTransaction.count({ where }),
    prisma.paymentTransaction.count({ where: { ...where, status: 'SUCCESS' } }),
    prisma.paymentTransaction.count({ where: { ...where, status: 'FAILED' } }),
  ]);

  const successRate = total > 0 ? Math.round((success / total) * 10000) / 100 : 100;

  return {
    totalPayments: total,
    successCount: success,
    failedCount: failed,
    successRatePercentage: successRate,
  };
}

export async function getRefundRate({ companyId }) {
  const where = companyId ? { companyId } : {};

  const [totalRefunds, processedRefunds, aggregate] = await Promise.all([
    prisma.refundRequest.count({ where }),
    prisma.refundRequest.count({ where: { ...where, status: 'PROCESSED' } }),
    prisma.refundRequest.aggregate({
      where: { ...where, status: 'PROCESSED' },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalRefundRequests: totalRefunds,
    processedCount: processedRefunds,
    totalRefundedAmount: Number(aggregate._sum.amount || 0),
  };
}

export async function getPaymentMethodStats() {
  return {
    methods: [
      { method: 'UPI / QR', percentage: 58 },
      { method: 'Credit / Debit Card', percentage: 27 },
      { method: 'Net Banking', percentage: 11 },
      { method: 'Corporate Wallet', percentage: 4 },
    ],
  };
}

export async function getRevenueByPlan({ companyId }) {
  const where = { status: 'ACTIVE' };
  if (companyId) where.companyId = companyId;

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: { plan: true },
  });

  const planMap = {};
  subscriptions.forEach((sub) => {
    const planName = sub.plan?.name || 'Default';
    planMap[planName] = (planMap[planName] || 0) + Number(sub.plan?.price || 0);
  });

  return Object.entries(planMap).map(([planName, revenue]) => ({
    planName,
    revenue,
  }));
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
