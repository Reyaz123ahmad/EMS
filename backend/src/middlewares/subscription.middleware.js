import prisma from '../config/prisma.js';

// In-memory cache for company subscription status (<0.01ms lookup)
const companySubCache = new Map();

/**
 * Middleware: Enforce Active Tenant Subscription
 */
export async function requireActiveSubscription(req, res, next) {
  try {
    // Super Admins bypass subscription checks
    if (req.user?.role === 'SUPER_ADMIN' || req.user?.roles?.includes('SUPER_ADMIN')) {
      return next();
    }

    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({
        status: 'error',
        message: 'No company tenant associated with this account'
      });
    }

    let company = null;
    const cached = companySubCache.get(companyId);
    if (cached && Date.now() < cached.expiresAt) {
      company = cached.data;
    } else {
      company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          status: true,
          subscription: {
            select: {
              status: true,
              startDate: true,
              endDate: true,
              trialEndsAt: true,
              plan: {
                select: {
                  name: true,
                  features: true,
                  maxEmployees: true,
                  maxBranches: true,
                  maxDevices: true
                }
              }
            }
          }
        }
      });
      if (company) {
        companySubCache.set(companyId, { data: company, expiresAt: Date.now() + 60000 });
      }
    }

    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
    }

    const sub = company.subscription;
    if (!sub) {
      return res.status(402).json({
        status: 'error',
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'No active subscription plan found. Please subscribe to continue.',
        upgradeUrl: '/renew'
      });
    }

    const isStatusActive = sub.status === 'ACTIVE' || sub.status === 'TRIAL';
    const isPastEndDate = sub.endDate && new Date(sub.endDate) < new Date();
    const isPastTrial = sub.status === 'TRIAL' && sub.trialEndsAt && new Date(sub.trialEndsAt) < new Date();

    if (!isStatusActive || isPastEndDate || isPastTrial) {
      return res.status(402).json({
        status: 'error',
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your company subscription plan has expired. Please renew your subscription to access this feature.',
        upgradeUrl: '/renew',
        plan: sub.plan?.name,
        expiredAt: sub.endDate || sub.trialEndsAt
      });
    }

    req.subscription = sub;
    req.company = company;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: Check Subscription Quota Limit (e.g. maxEmployees, maxBranches)
 * @param {'maxEmployees' | 'maxBranches' | 'maxDevices'} limitKey
 */
export function checkSubscriptionLimit(limitKey) {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'SUPER_ADMIN') {
        return next();
      }

      const companyId = req.user?.companyId;
      if (!companyId) return next();

      const plan = req.subscription?.plan;
      if (!plan || !plan[limitKey]) {
        return next();
      }

      const maxAllowed = plan[limitKey];

      if (limitKey === 'maxEmployees') {
        const count = await prisma.employee.count({
          where: { companyId, status: { not: 'TERMINATED' } }
        });
        if (count >= maxAllowed) {
          return res.status(403).json({
            status: 'error',
            code: 'PLAN_LIMIT_REACHED',
            message: `Employee quota limit reached (${count}/${maxAllowed}). Please upgrade your plan to onboard more employees.`
          });
        }
      } else if (limitKey === 'maxBranches') {
        const count = await prisma.branch.count({ where: { companyId } });
        if (count >= maxAllowed) {
          return res.status(403).json({
            status: 'error',
            code: 'PLAN_LIMIT_REACHED',
            message: `Branch quota limit reached (${count}/${maxAllowed}). Please upgrade your plan to add more branches.`
          });
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: Check Plan Feature Flag (e.g. 'attendance.card', 'attendance.finger', 'payroll')
 * @param {string} featurePath
 */
export function requireFeature(featurePath) {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'SUPER_ADMIN') {
        return next();
      }

      const plan = req.subscription?.plan;
      if (!plan || !plan.features) {
        return next(); // Default allow if not restricted
      }

      const features = plan.features;
      const keys = featurePath.split('.');
      let current = features;

      for (const k of keys) {
        if (current === undefined || current === null) break;
        current = current[k];
      }

      if (current === false) {
        return res.status(403).json({
          status: 'error',
          code: 'FEATURE_NOT_INCLUDED',
          message: `The feature '${featurePath}' is not included in your current subscription plan. Please upgrade to access this feature.`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export default {
  requireActiveSubscription,
  checkSubscriptionLimit,
  requireFeature
};
