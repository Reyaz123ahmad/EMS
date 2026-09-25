import prisma from '../../src/config/prisma.js';

export async function ensureBaseCompany() {
  let plan = await prisma.subscriptionPlan.findFirst();
  if (!plan) {
    plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Enterprise Plan',
        price: 9999,
        billingCycle: 'monthly',
        features: { payroll: true, attendance: true, biometrics: true },
        maxEmployees: 500,
        maxBranches: 10,
        maxDevices: 10,
        maxStorageGB: 100,
        securityLevel: 'high',
        isActive: true,
      },
    });
  }

  let company = await prisma.company.findFirst({
    include: { subscription: true },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'MindTech Global Solutions',
        companyCode: 'MIND-2026-0001',
        domain: `mindtech-${Date.now()}.com`,
        status: 'ACTIVE',
      },
    });
  }

  if (!company.subscription) {
    await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: plan.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 86400000),
        trialEndsAt: new Date(Date.now() + 365 * 86400000),
        autoRenew: true,
      },
    });
  }

  return { company, plan };
}

export default {
  ensureBaseCompany,
};
