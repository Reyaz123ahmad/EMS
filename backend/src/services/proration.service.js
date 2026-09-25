import prisma from '../config/prisma.js';
import dayjs from 'dayjs';

/**
 * Calculate prorated upgrade/downgrade amounts
 */
export async function calculateProration({ subscriptionId, companyId, newPlanId, changeType = 'UPGRADE' }) {
  const where = subscriptionId ? { id: subscriptionId } : (companyId ? { companyId } : null);
  if (!where) {
    const error = new Error('Subscription identifier is required');
    error.statusCode = 400;
    throw error;
  }

  const subscription = await prisma.subscription.findUnique({
    where,
    include: { plan: true },
  });

  if (!subscription) {
    const error = new Error('Subscription not found');
    error.statusCode = 404;
    throw error;
  }

  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: newPlanId },
  });

  if (!newPlan) {
    const error = new Error('New target plan not found');
    error.statusCode = 404;
    throw error;
  }

  const currentPlan = subscription.plan;
  const now = dayjs();
  const endDate = dayjs(subscription.endDate || now.add(30, 'day'));
  const startDate = dayjs(subscription.startDate || now);

  const totalCycleDays = Math.max(1, endDate.diff(startDate, 'day') || 30);
  const remainingDays = Math.max(0, endDate.diff(now, 'day'));

  const currentDailyRate = Number(currentPlan.price) / totalCycleDays;
  const newDailyRate = Number(newPlan.price) / totalCycleDays;

  const unusedCurrentValue = Math.round(currentDailyRate * remainingDays * 100) / 100;
  const newPlanProratedCost = Math.round(newDailyRate * remainingDays * 100) / 100;

  const netDifference = Math.round((newPlanProratedCost - unusedCurrentValue) * 100) / 100;

  const chargeAmount = netDifference > 0 ? netDifference : 0;
  const creditAmount = netDifference < 0 ? Math.abs(netDifference) : 0;

  return {
    subscriptionId,
    changeType,
    currentPlan: { id: currentPlan.id, name: currentPlan.name, price: Number(currentPlan.price) },
    newPlan: { id: newPlan.id, name: newPlan.name, price: Number(newPlan.price) },
    totalCycleDays,
    remainingDays,
    unusedCurrentValue,
    newPlanProratedCost,
    chargeAmount,
    creditAmount,
    total: chargeAmount,
    breakdown: {
      dailyCredit: currentDailyRate,
      dailyDebit: newDailyRate,
      netDailyDifference: newDailyRate - currentDailyRate,
    },
  };
}

/**
 * Apply calculated proration and transition subscription
 */
export async function applyProration({ subscriptionId, companyId, newPlanId, changeType = 'UPGRADE' }) {
  const calculation = await calculateProration({ subscriptionId, companyId, newPlanId, changeType });
  const where = subscriptionId ? { id: subscriptionId } : { companyId };

  // Update subscription to new plan
  const updatedSubscription = await prisma.subscription.update({
    where,
    data: {
      planId: newPlanId,
      status: 'ACTIVE',
    },
    include: { plan: true },
  });

  // If charge applies, record payment
  let payment = null;
  if (calculation.chargeAmount > 0) {
    payment = await prisma.paymentTransaction.create({
      data: {
        subscriptionId: updatedSubscription.id,
        amount: calculation.chargeAmount,
        status: 'SUCCESS',
        razorpayPaymentId: `prorate_pay_${Date.now()}`,
        metadata: {
          type: 'PRORATION_CHARGE',
          calculation,
        },
      },
    });
  }

  return {
    subscription: updatedSubscription,
    proration: calculation,
    payment,
    message: `Plan changed to ${updatedSubscription.plan.name} with proration applied.`,
  };
}

export default {
  calculateProration,
  applyProration,
};
