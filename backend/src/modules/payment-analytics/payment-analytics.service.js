import prisma from '../../config/prisma.js';
import dayjs from 'dayjs';

export async function getRevenueStats({ companyId, startDate, endDate }) {
  const where = { status: 'SUCCESS' };
  if (companyId) {
    where.subscription = { companyId };
  }
  const hasStart = startDate && typeof startDate === 'string' && startDate.trim() !== '' && !isNaN(new Date(startDate).getTime());
  const hasEnd = endDate && typeof endDate === 'string' && endDate.trim() !== '' && !isNaN(new Date(endDate).getTime());

  if (hasStart || hasEnd) {
    where.createdAt = {};
    if (hasStart) where.createdAt.gte = new Date(startDate);
    if (hasEnd) where.createdAt.lte = new Date(endDate);
  }

  const payments = await prisma.paymentTransaction.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const monthlyRevenue = payments
    .filter((p) => dayjs(p.createdAt).isAfter(dayjs().subtract(30, 'day')))
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  // Group by day for charts
  const dailyMap = {};
  payments.forEach((p) => {
    const date = dayjs(p.createdAt).format('YYYY-MM-DD');
    dailyMap[date] = (dailyMap[date] || 0) + Number(p.amount || 0);
  });

  const trend = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));

  return {
    totalRevenue: totalRevenue || 0,
    monthlyRevenue: monthlyRevenue || 0,
    paymentCount: payments.length || 0,
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
    mrr: Math.round(mrr * 100) / 100 || 0,
    activeSubscribers: subscriptions.length || 0,
    currency: 'INR',
  };
}

export async function getARR({ companyId }) {
  const { mrr, activeSubscribers } = await getMRR({ companyId });
  const arr = mrr * 12;

  return {
    arr: Math.round(arr * 100) / 100 || 0,
    mrr: mrr || 0,
    activeSubscribers: activeSubscribers || 0,
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
    totalSubscriptions: total || 0,
    cancelled: cancelled || 0,
    expired: expired || 0,
    churnedTotal: churned || 0,
    churnRatePercentage: churnRate || 0,
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
    totalPayments: total || 0,
    successCount: success || 0,
    failedCount: failed || 0,
    successRatePercentage: successRate || 0,
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
    totalRefundRequests: totalRefunds || 0,
    processedCount: processedRefunds || 0,
    totalRefundedAmount: Number(aggregate._sum?.amount || 0),
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
    if (!planMap[planName]) {
      planMap[planName] = { revenue: 0, subscribers: 0 };
    }
    planMap[planName].revenue += Number(sub.plan?.price || 0);
    planMap[planName].subscribers += 1;
  });

  return Object.entries(planMap).map(([planName, item]) => ({
    planName,
    revenue: item.revenue || 0,
    amount: item.revenue || 0,
    subscribers: item.subscribers || 0,
    subscriptionCount: item.subscribers || 0,
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
