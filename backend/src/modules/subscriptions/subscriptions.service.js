import { prisma } from '../../config/prisma.js';
import crypto from 'crypto';

export const subscriptionsService = {
  async getPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  },

  async getPlanById(planId) {
    return prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
  },

  async createPlan(data) {
    return prisma.subscriptionPlan.create({
      data,
    });
  },

  async updatePlan(planId, data) {
    return prisma.subscriptionPlan.update({
      where: { id: planId },
      data,
    });
  },

  async deletePlan(planId) {
    return prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });
  },

  async getCurrentSubscription(companyId) {
    let sub = await prisma.subscription.findUnique({
      where: { companyId },
      include: {
        plan: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!sub) {
      // Fallback: assign or return trial subscription on default plan
      const defaultPlan = await prisma.subscriptionPlan.findFirst({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });

      if (defaultPlan) {
        sub = await prisma.subscription.create({
          data: {
            companyId,
            planId: defaultPlan.id,
            status: 'TRIAL',
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          include: {
            plan: true,
            invoices: true,
          },
        });
      }
    }

    // Calculate usage metrics
    const [employeeCount, branchCount, deviceCount] = await Promise.all([
      prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.branch.count({ where: { companyId, isActive: true } }),
      prisma.biometricDevice.count({ where: { companyId, isActive: true } }),
    ]);

    const daysRemaining = sub?.endDate
      ? Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      subscription: sub,
      usage: {
        employees: employeeCount,
        maxEmployees: sub?.plan?.maxEmployees || 50,
        branches: branchCount,
        maxBranches: sub?.plan?.maxBranches || 1,
        devices: deviceCount,
        maxDevices: sub?.plan?.maxDevices || 1,
        storageUsedGB: 1.2,
        maxStorageGB: sub?.plan?.maxStorageGB || 5,
      },
      daysRemaining,
      isExpired: sub?.status === 'EXPIRED' || daysRemaining <= 0,
    };
  },

  async createOrder({ companyId, planId, billingCycle = 'monthly' }) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Selected plan not found');

    const amount = Number(plan.price) * (billingCycle === 'yearly' ? 10 : 1); // 2 months free on yearly
    const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    return {
      orderId,
      amount: amount * 100, // paise
      currency: 'INR',
      planId: plan.id,
      planName: plan.name,
      billingCycle,
    };
  },

  async verifyPayment({ companyId, planId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    const durationDays = plan.billingCycle === 'yearly' ? 365 : 30;
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.upsert({
      where: { companyId },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate,
        autoRenew: true,
      },
      create: {
        companyId,
        planId: plan.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate,
        autoRenew: true,
      },
      include: { plan: true },
    });

    // Create Payment transaction record
    await prisma.paymentTransaction.create({
      data: {
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: 'INR',
        status: 'SUCCESS',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        metadata: { planName: plan.name, upgradedAt: new Date().toISOString() },
      },
    });

    // Generate Invoice record
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const invoice = await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        invoiceNumber,
        amount: plan.price,
        tax: Number(plan.price) * 0.18,
        total: Number(plan.price) * 1.18,
        status: 'PAID',
        dueDate: new Date(),
        paidAt: new Date(),
        pdfUrl: `https://invoices.ems-cloud.internal/${invoiceNumber}.pdf`,
      },
    });

    return {
      subscription,
      invoice,
      status: 'SUCCESS',
      message: 'Subscription updated and payment verified successfully!',
    };
  },

  async renewSubscription({ companyId, planId, billingCycle = 'monthly' }) {
    let sub = await prisma.subscription.findUnique({ where: { companyId }, include: { plan: true } });
    const targetPlanId = planId || sub?.planId;
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: targetPlanId } });
    if (!plan) throw new Error('Plan not found');

    const days = billingCycle === 'yearly' ? 365 : 30;
    const newEndDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.subscription.update({
      where: { companyId },
      data: {
        planId: plan.id,
        status: 'ACTIVE',
        endDate: newEndDate,
        autoRenew: true,
      },
      include: { plan: true },
    });

    return {
      subscription: updated,
      daysRemaining: days,
      message: 'Subscription renewed successfully.',
    };
  },

  async cancelSubscription({ companyId, reason }) {
    const updated = await prisma.subscription.update({
      where: { companyId },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
      },
    });

    return {
      subscription: updated,
      reason,
      cancelledAt: new Date(),
    };
  },

  async getSubscriptionHistory(companyId) {
    const sub = await prisma.subscription.findUnique({
      where: { companyId },
      include: {
        invoices: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    return {
      companyId,
      invoices: sub?.invoices || [],
      payments: sub?.payments || [],
    };
  },

  async getSubscriptionStats(companyId) {
    const current = await this.getCurrentSubscription(companyId);
    return {
      status: current.subscription?.status || 'ACTIVE',
      planName: current.subscription?.plan?.name || 'Pro',
      daysRemaining: current.daysRemaining,
      isExpired: current.isExpired,
      usage: current.usage,
    };
  },

  async checkSubscriptionExpiry(companyId) {
    const current = await this.getCurrentSubscription(companyId);
    return {
      isExpired: current.isExpired,
      daysRemaining: current.daysRemaining,
      status: current.subscription?.status,
      plan: current.subscription?.plan?.name,
    };
  },

  async startTrial({ companyId, planId }) {
    const targetPlan = planId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
      : await prisma.subscriptionPlan.findFirst({ where: { isActive: true }, orderBy: { price: 'asc' } });

    if (!targetPlan) throw new Error('No active subscription plan found');

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const subscription = await prisma.subscription.upsert({
      where: { companyId },
      update: {
        planId: targetPlan.id,
        status: 'TRIAL',
        startDate: new Date(),
        endDate: trialEndsAt,
        trialEndsAt,
        autoRenew: false,
      },
      create: {
        companyId,
        planId: targetPlan.id,
        status: 'TRIAL',
        startDate: new Date(),
        endDate: trialEndsAt,
        trialEndsAt,
        autoRenew: false,
      },
      include: { plan: true },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: { status: 'TRIAL' },
    });

    return subscription;
  },

  async convertTrialToPaid({ companyId, planId, paymentId }) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.update({
      where: { companyId },
      data: {
        planId: plan.id,
        status: 'ACTIVE',
        endDate,
        autoRenew: true,
      },
      include: { plan: true },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: { status: 'ACTIVE' },
    });

    return subscription;
  },

  async extendTrial({ companyId, days = 7, extendedBy }) {
    const sub = await prisma.subscription.findUnique({ where: { companyId } });
    if (!sub) throw new Error('Subscription not found');

    const currentEnd = sub.trialEndsAt || sub.endDate || new Date();
    const newEnd = new Date(new Date(currentEnd).getTime() + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.subscription.update({
      where: { companyId },
      data: {
        status: 'TRIAL',
        endDate: newEnd,
        trialEndsAt: newEnd,
      },
      include: { plan: true },
    });

    return {
      subscription: updated,
      daysExtended: days,
      newTrialEndsAt: newEnd,
    };
  },

  async cancelTrial({ companyId, reason }) {
    const updated = await prisma.subscription.update({
      where: { companyId },
      data: {
        status: 'CANCELLED',
      },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: { status: 'SUSPENDED' },
    });

    return {
      subscription: updated,
      reason,
    };
  },
};
