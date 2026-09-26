import prisma from '../../config/prisma.js';
import dayjs from 'dayjs';

export async function getRevenueStats({ companyId, startDate, endDate } = {}) {
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

  // Group by month for 6-month RevenueChart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyTrend = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthName = months[d.getMonth()];

    const monthSum = payments
      .filter((p) => new Date(p.createdAt) >= d && new Date(p.createdAt) <= endOfMonth)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    monthlyTrend.push({
      month: monthName,
      revenue: monthSum
    });
  }

  // Daily map
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
    monthlyTrend,
  };
}

export async function getMRR({ companyId } = {}) {
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

export async function getARR({ companyId } = {}) {
  const { mrr, activeSubscribers } = await getMRR({ companyId });
  const arr = mrr * 12;

  return {
    arr: Math.round(arr * 100) / 100 || 0,
    mrr: mrr || 0,
    activeSubscribers: activeSubscribers || 0,
    currency: 'INR',
  };
}

export async function getChurnRate({ companyId } = {}) {
  const whereTotal = companyId ? { companyId } : {};
  const [total, cancelled, expired] = await Promise.all([
    prisma.subscription.count({ where: whereTotal }),
    prisma.subscription.count({ where: { ...whereTotal, status: 'CANCELLED' } }),
    prisma.subscription.count({ where: { ...whereTotal, status: 'EXPIRED' } }),
  ]);

  const churned = cancelled + expired;
  const churnRate = total > 0 ? Math.round((churned / total) * 10000) / 100 : 0;

  // Real 6-month churn trend
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyTrend = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthName = months[d.getMonth()];

    const [monthTotal, monthCancelled] = await Promise.all([
      prisma.subscription.count({
        where: {
          ...whereTotal,
          createdAt: { lte: endOfMonth }
        }
      }).catch(() => 0),
      prisma.subscription.count({
        where: {
          ...whereTotal,
          status: { in: ['CANCELLED', 'EXPIRED'] },
          updatedAt: { gte: d, lte: endOfMonth }
        }
      }).catch(() => 0)
    ]);

    const rate = monthTotal > 0 ? Math.round((monthCancelled / monthTotal) * 1000) / 10 : 0;
    monthlyTrend.push({
      month: monthName,
      churnRate: rate
    });
  }

  return {
    totalSubscriptions: total || 0,
    cancelled: cancelled || 0,
    expired: expired || 0,
    churnedTotal: churned || 0,
    churnedSubscriptions: churned || 0,
    churnRate: churnRate || 0,
    churnRatePercentage: churnRate || 0,
    monthlyTrend
  };
}

export async function getPaymentSuccessRate({ companyId } = {}) {
  const where = {};
  if (companyId) {
    where.subscription = { companyId };
  }

  const [total, success, failed] = await Promise.all([
    prisma.paymentTransaction.count({ where }),
    prisma.paymentTransaction.count({ where: { ...where, status: 'SUCCESS' } }),
    prisma.paymentTransaction.count({ where: { ...where, status: 'FAILED' } }),
  ]);

  const successRate = total > 0 ? Math.round((success / total) * 10000) / 100 : (total === 0 ? 100 : 0);

  // 7-day daily trend for SuccessRateChart
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const dailyTrend = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    const dayName = days[d.getDay()];

    const [dayTotal, daySuccess] = await Promise.all([
      prisma.paymentTransaction.count({
        where: { ...where, createdAt: { gte: startOfDay, lte: endOfDay } }
      }).catch(() => 0),
      prisma.paymentTransaction.count({
        where: { ...where, status: 'SUCCESS', createdAt: { gte: startOfDay, lte: endOfDay } }
      }).catch(() => 0)
    ]);

    const rate = dayTotal > 0 ? Math.round((daySuccess / dayTotal) * 1000) / 10 : 100;
    dailyTrend.push({
      date: dayName,
      successRate: rate
    });
  }

  return {
    totalPayments: total || 0,
    totalTransactions: total || 0,
    successCount: success || 0,
    failedCount: failed || 0,
    failedTransactions: failed || 0,
    successRate: successRate || 0,
    successRatePercentage: successRate || 0,
    dailyTrend
  };
}

export async function getRefundRate({ companyId } = {}) {
  const where = companyId ? { companyId } : {};

  const [totalRefunds, processedRefunds, aggregate, reasonGroups] = await Promise.all([
    prisma.refundRequest.count({ where }).catch(() => 0),
    prisma.refundRequest.count({ where: { ...where, status: 'PROCESSED' } }).catch(() => 0),
    prisma.refundRequest.aggregate({
      where: { ...where, status: 'PROCESSED' },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } })),
    prisma.refundRequest.groupBy({
      by: ['reason'],
      where,
      _count: { reason: true }
    }).catch(() => [])
  ]);

  const refundRate = totalRefunds > 0 ? Math.round((processedRefunds / totalRefunds) * 1000) / 10 : 0;
  const reasons = reasonGroups.map((r) => ({
    reason: r.reason || 'General Inquiry',
    count: r._count?.reason || 0
  }));

  return {
    totalRefundRequests: totalRefunds || 0,
    totalRefundCount: totalRefunds || 0,
    processedCount: processedRefunds || 0,
    totalRefundedAmount: Number(aggregate._sum?.amount || 0),
    refundRate,
    reasons
  };
}

export async function getPaymentMethodStats({ companyId } = {}) {
  const where = { status: 'SUCCESS' };
  if (companyId) {
    where.subscription = { companyId };
  }

  const transactions = await prisma.paymentTransaction.findMany({
    where,
    select: { gateway: true, method: true, amount: true }
  }).catch(() => []);

  const total = transactions.length;
  if (total === 0) {
    return {
      methods: [
        { method: 'UPI / QR', count: 0, percentage: 0 },
        { method: 'Credit / Debit Card', count: 0, percentage: 0 },
        { method: 'Net Banking', count: 0, percentage: 0 }
      ]
    };
  }

  const methodCounts = {};
  transactions.forEach((t) => {
    const m = t.method || (t.gateway === 'RAZORPAY' ? 'UPI / QR' : 'Credit / Debit Card');
    methodCounts[m] = (methodCounts[m] || 0) + 1;
  });

  const methods = Object.entries(methodCounts).map(([method, count]) => ({
    method,
    count,
    percentage: Math.round((count / total) * 1000) / 10
  }));

  return { methods };
}

export async function getRevenueByPlan({ companyId } = {}) {
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
