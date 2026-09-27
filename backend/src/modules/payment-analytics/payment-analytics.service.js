import prisma from '../../config/prisma.js';
import dayjs from 'dayjs';

export async function getRevenueStats({ companyId, role, startDate, endDate } = {}) {
  const isSuperAdmin = role === 'SUPER_ADMIN' || !companyId;

  if (isSuperAdmin) {
    return await getPlatformRevenue({ startDate, endDate });
  }

  return await getCompanyRevenue({ companyId, startDate, endDate });
}

export async function getPlatformRevenue({ startDate, endDate } = {}) {
  const where = { status: 'SUCCESS' };
  const hasStart = startDate && typeof startDate === 'string' && startDate.trim() !== '' && !isNaN(new Date(startDate).getTime());
  const hasEnd = endDate && typeof endDate === 'string' && endDate.trim() !== '' && !isNaN(new Date(endDate).getTime());

  if (hasStart || hasEnd) {
    where.createdAt = {};
    if (hasStart) where.createdAt.gte = new Date(startDate);
    if (hasEnd) where.createdAt.lte = new Date(endDate);
  }

  const payments = await prisma.paymentTransaction.findMany({
    where,
    include: {
      subscription: {
        include: { company: true, plan: true }
      }
    },
    orderBy: { createdAt: 'asc' },
  }).catch(() => []);

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
    type: 'PLATFORM_REVENUE',
    description: 'Revenue from company subscriptions',
    totalRevenue: totalRevenue || 0,
    monthlyRevenue: monthlyRevenue || 0,
    paymentCount: payments.length || 0,
    transactionCount: payments.length || 0,
    trend,
    monthlyTrend,
    transactions: payments,
  };
}

export async function getCompanyRevenue({ companyId, startDate, endDate } = {}) {
  const dateFilter = {};
  const hasStart = startDate && typeof startDate === 'string' && startDate.trim() !== '' && !isNaN(new Date(startDate).getTime());
  const hasEnd = endDate && typeof endDate === 'string' && endDate.trim() !== '' && !isNaN(new Date(endDate).getTime());
  if (hasStart) dateFilter.gte = new Date(startDate);
  if (hasEnd) dateFilter.lte = new Date(endDate);

  // 1. Company's REVENUE = Money earned from client projects / deliverables
  const projectWhere = { companyId };
  if (hasStart || hasEnd) projectWhere.createdAt = dateFilter;

  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      include: { client: true }
    }).catch(() => []),
    prisma.client.findMany({
      where: { companyId }
    }).catch(() => [])
  ]);

  const clientPayments = projects.map((p) => ({
    id: p.id,
    title: p.name,
    clientName: p.client?.name || p.client?.companyName || 'Enterprise Client',
    amount: Number(p.budget || 0),
    status: 'PAID',
    date: p.createdAt,
    createdAt: p.createdAt
  }));

  const totalRevenue = clientPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // 2. Company's EXPENSE = Subscription payments made to EMS Platform
  const subWhere = {
    subscription: { companyId },
    status: 'SUCCESS'
  };
  if (hasStart || hasEnd) subWhere.createdAt = dateFilter;

  const subscriptionPayments = await prisma.paymentTransaction.findMany({
    where: subWhere,
    include: {
      subscription: {
        include: { plan: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  }).catch(() => []);

  const totalExpense = subscriptionPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const netIncome = totalRevenue - totalExpense;

  // Monthly trend for company (Revenue vs Expense)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyTrend = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthName = months[d.getMonth()];

    const monthRev = clientPayments
      .filter((p) => new Date(p.createdAt) >= d && new Date(p.createdAt) <= endOfMonth)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const monthExp = subscriptionPayments
      .filter((p) => new Date(p.createdAt) >= d && new Date(p.createdAt) <= endOfMonth)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    monthlyTrend.push({
      month: monthName,
      revenue: monthRev,
      expense: monthExp,
      net: monthRev - monthExp
    });
  }

  return {
    type: 'COMPANY_REVENUE',
    description: 'Revenue from clients & SaaS subscription expenses',
    totalRevenue,
    totalExpense,
    netIncome,
    clientCount: clients.length || 0,
    projectCount: projects.length || 0,
    clientPayments,
    subscriptionPayments: subscriptionPayments.map((p) => ({
      id: p.id,
      amount: Number(p.amount || 0),
      type: 'EXPENSE',
      planName: p.subscription?.plan?.name || 'EMS Subscription',
      description: `Subscription payment to EMS Platform (${p.subscription?.plan?.name || 'SaaS Plan'})`,
      status: p.status,
      date: p.createdAt,
      createdAt: p.createdAt
    })),
    monthlyTrend
  };
}

export async function getMRR({ companyId, role } = {}) {
  const isSuperAdmin = role === 'SUPER_ADMIN' || !companyId;

  if (isSuperAdmin) {
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    }).catch(() => []);

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
      type: 'PLATFORM_MRR'
    };
  }

  // For tenant company: MRR is platform-level
  return {
    mrr: 0,
    activeSubscribers: 0,
    currency: 'INR',
    message: 'MRR is a platform-level subscription metric',
    type: 'NOT_APPLICABLE'
  };
}

export async function getARR({ companyId, role } = {}) {
  const isSuperAdmin = role === 'SUPER_ADMIN' || !companyId;

  if (isSuperAdmin) {
    const { mrr, activeSubscribers } = await getMRR({ companyId, role });
    const arr = mrr * 12;

    return {
      arr: Math.round(arr * 100) / 100 || 0,
      mrr: mrr || 0,
      activeSubscribers: activeSubscribers || 0,
      currency: 'INR',
      type: 'PLATFORM_ARR'
    };
  }

  return {
    arr: 0,
    mrr: 0,
    activeSubscribers: 0,
    currency: 'INR',
    message: 'ARR is a platform-level subscription metric',
    type: 'NOT_APPLICABLE'
  };
}

export async function getChurnRate({ companyId, role } = {}) {
  const isSuperAdmin = role === 'SUPER_ADMIN' || !companyId;
  const whereTotal = isSuperAdmin ? {} : { companyId };

  const [total, cancelled, expired] = await Promise.all([
    prisma.subscription.count({ where: whereTotal }).catch(() => 0),
    prisma.subscription.count({ where: { ...whereTotal, status: 'CANCELLED' } }).catch(() => 0),
    prisma.subscription.count({ where: { ...whereTotal, status: 'EXPIRED' } }).catch(() => 0),
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

export async function getPaymentSuccessRate({ companyId, role } = {}) {
  const isSuperAdmin = role === 'SUPER_ADMIN' || !companyId;
  const where = {};
  if (!isSuperAdmin && companyId) {
    where.subscription = { companyId };
  }

  const [total, success, failed] = await Promise.all([
    prisma.paymentTransaction.count({ where }).catch(() => 0),
    prisma.paymentTransaction.count({ where: { ...where, status: 'SUCCESS' } }).catch(() => 0),
    prisma.paymentTransaction.count({ where: { ...where, status: 'FAILED' } }).catch(() => 0),
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

export async function getRefundRate({ companyId, role } = {}) {
  const isSuperAdmin = role === 'SUPER_ADMIN' || !companyId;
  const where = (!isSuperAdmin && companyId) ? { companyId } : {};

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

export async function getPaymentMethodStats({ companyId, role, dateRange, startDate, endDate } = {}) {
  const isSuperAdmin = role === 'SUPER_ADMIN' || !companyId;
  const where = { status: 'SUCCESS' };
  if (!isSuperAdmin && companyId) {
    where.subscription = { companyId };
  }

  const start = startDate || dateRange?.start;
  const end = endDate || dateRange?.end;
  if (start || end) {
    where.createdAt = {};
    if (start) where.createdAt.gte = new Date(start);
    if (end) where.createdAt.lte = new Date(end);
  }

  const transactions = await prisma.paymentTransaction.findMany({
    where,
    select: { id: true, amount: true, metadata: true, createdAt: true }
  }).catch(() => []);

  const methodLabels = {
    upi: 'UPI / QR',
    card: 'Credit / Debit Card',
    netbanking: 'Net Banking',
    wallet: 'Wallet',
  };

  const total = transactions.length;
  const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  if (total === 0) {
    return {
      methods: [
        { method: 'UPI / QR', label: 'UPI / QR', count: 0, percentage: 0, amount: 0 },
        { method: 'Credit / Debit Card', label: 'Credit / Debit Card', count: 0, percentage: 0, amount: 0 },
        { method: 'Net Banking', label: 'Net Banking', count: 0, percentage: 0, amount: 0 },
        { method: 'Wallet', label: 'Wallet', count: 0, percentage: 0, amount: 0 }
      ],
      totalTransactions: 0,
      totalAmount: 0
    };
  }

  const grouped = {
    upi: { count: 0, amount: 0 },
    card: { count: 0, amount: 0 },
    netbanking: { count: 0, amount: 0 },
    wallet: { count: 0, amount: 0 }
  };

  transactions.forEach((t) => {
    const meta = typeof t.metadata === 'object' && t.metadata !== null ? t.metadata : {};
    const rawMethod = (meta.paymentMethod || meta.method || meta.paymentMethodDetails?.method || 'card').toLowerCase();

    let methodKey = 'card';
    if (rawMethod.includes('upi') || rawMethod.includes('qr') || rawMethod.includes('vpa')) {
      methodKey = 'upi';
    } else if (rawMethod.includes('card') || rawMethod.includes('visa') || rawMethod.includes('master') || rawMethod.includes('rupay')) {
      methodKey = 'card';
    } else if (rawMethod.includes('net') || rawMethod.includes('bank') || rawMethod.includes('nb')) {
      methodKey = 'netbanking';
    } else if (rawMethod.includes('wallet') || rawMethod.includes('paytm')) {
      methodKey = 'wallet';
    }

    if (!grouped[methodKey]) {
      grouped[methodKey] = { count: 0, amount: 0 };
    }
    grouped[methodKey].count += 1;
    grouped[methodKey].amount += Number(t.amount || 0);
  });

  const methods = Object.entries(methodLabels).map(([key, label]) => {
    const data = grouped[key] || { count: 0, amount: 0 };
    const percentage = total > 0 ? Math.round((data.count / total) * 1000) / 10 : 0;
    return {
      method: label,
      rawMethod: key,
      label,
      count: data.count,
      amount: data.amount,
      percentage
    };
  });

  return {
    methods,
    totalTransactions: total,
    totalAmount
  };
}

export async function getRevenueByPlan({ companyId, role } = {}) {
  const isSuperAdmin = role === 'SUPER_ADMIN' || !companyId;
  const where = { status: 'ACTIVE' };
  if (!isSuperAdmin && companyId) where.companyId = companyId;

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: { plan: true },
  }).catch(() => []);

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
  getPlatformRevenue,
  getCompanyRevenue,
  getMRR,
  getARR,
  getChurnRate,
  getPaymentSuccessRate,
  getRefundRate,
  getPaymentMethodStats,
  getRevenueByPlan,
};

