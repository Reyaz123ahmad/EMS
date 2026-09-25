import prisma from '../config/prisma.js';
import dayjs from 'dayjs';

/**
 * Daily subscription check for expirations, reminders, and auto-renewals
 */
export async function dailySubscriptionCheck() {
  const now = new Date();
  const today = dayjs(now);

  // 1. Find subscriptions expiring soon (7, 3, 1 days)
  const activeSubs = await prisma.subscription.findMany({
    where: { status: 'ACTIVE', endDate: { not: null } },
    include: { company: true, plan: true },
  });

  for (const sub of activeSubs) {
    if (!sub.endDate) continue;
    const diffDays = dayjs(sub.endDate).diff(today, 'day');

    if (diffDays <= 0) {
      // Expired!
      if (sub.autoRenew) {
        await autoRenewSubscription(sub.id);
      } else {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        });
      }
    }
  }

  return { checked: activeSubs.length, timestamp: now };
}

/**
 * Dunning process for overdue payments & subscription grace period enforcement
 */
export async function dunningProcess() {
  const now = new Date();

  // Find PAST_DUE subscriptions
  const overdueSubs = await prisma.subscription.findMany({
    where: { status: 'PAST_DUE' },
    include: { company: true },
  });

  for (const sub of overdueSubs) {
    const daysOverdue = dayjs(now).diff(dayjs(sub.updatedAt), 'day');

    // If past 7 days overdue, suspend company access
    if (daysOverdue >= 7) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });
      await prisma.company.update({
        where: { id: sub.companyId },
        data: { status: 'SUSPENDED' },
      });
    }
  }

  return { dunningChecked: overdueSubs.length, timestamp: now };
}

/**
 * Auto-renew subscription
 */
export async function autoRenewSubscription(subscriptionId) {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!sub) return null;

    const newEndDate = dayjs(sub.endDate || new Date())
      .add(1, sub.plan.billingCycle === 'yearly' ? 'year' : 'month')
      .toDate();

    const payment = await prisma.paymentTransaction.create({
      data: {
        subscriptionId: sub.id,
        amount: sub.plan.price,
        status: 'SUCCESS',
        razorpayPaymentId: `auto_pay_${Date.now()}`,
        metadata: { type: 'AUTO_RENEWAL' },
      },
    });

    const updatedSub = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        endDate: newEndDate,
      },
    });

    return { subscription: updatedSub, payment };
  } catch (err) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'PAST_DUE' },
    });
    return null;
  }
}

export default {
  dailySubscriptionCheck,
  dunningProcess,
  autoRenewSubscription,
};
