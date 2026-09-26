import { subscriptionsService } from './subscriptions.service.js';
import { successResponse } from '../../utils/response.js';

export const subscriptionsController = {
  async getPlans(req, res, next) {
    try {
      const plans = await subscriptionsService.getPlans();
      return successResponse(res, plans, 'Plans retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async getCurrentSubscription(req, res, next) {
    try {
      const companyId = req.query.companyId || req.user?.companyId;
      if (!companyId) {
        return successResponse(res, {
          isPlatformAdmin: true,
          message: 'Platform Super Admin does not require a subscription',
          subscription: null,
          plan: null,
          invoices: [],
          payments: []
        }, 'Platform admin status');
      }
      const data = await subscriptionsService.getCurrentSubscription(companyId);
      return successResponse(res, data, 'Subscription retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async getPlatformStatus(req, res, next) {
    try {
      return successResponse(res, {
        isPlatformAdmin: true,
        message: 'Platform Super Admin does not require a subscription'
      }, 'Platform admin status');
    } catch (err) {
      next(err);
    }
  },

  async createOrder(req, res, next) {
    try {
      const companyId = req.body.companyId || req.user?.companyId;
      const order = await subscriptionsService.createOrder({
        companyId,
        planId: req.body.planId,
        billingCycle: req.body.billingCycle,
      });
      res.status(201).json({ status: 'SUCCESS', data: order });
    } catch (err) {
      next(err);
    }
  },

  async verifyPayment(req, res, next) {
    try {
      const companyId = req.body.companyId || req.user?.companyId;
      const result = await subscriptionsService.verifyPayment({
        companyId,
        planId: req.body.planId,
        razorpayOrderId: req.body.razorpayOrderId,
        razorpayPaymentId: req.body.razorpayPaymentId,
        razorpaySignature: req.body.razorpaySignature,
      });
      res.status(200).json({ status: 'SUCCESS', data: result });
    } catch (err) {
      next(err);
    }
  },

  async renewSubscription(req, res, next) {
    try {
      const companyId = req.body.companyId || req.user?.companyId;
      const result = await subscriptionsService.renewSubscription({
        companyId,
        planId: req.body.planId,
        billingCycle: req.body.billingCycle,
      });
      res.status(200).json({ status: 'SUCCESS', data: result });
    } catch (err) {
      next(err);
    }
  },

  async cancelSubscription(req, res, next) {
    try {
      const companyId = req.body.companyId || req.user?.companyId;
      const result = await subscriptionsService.cancelSubscription({
        companyId,
        reason: req.body.reason,
      });
      res.status(200).json({ status: 'SUCCESS', data: result });
    } catch (err) {
      next(err);
    }
  },

  async getSubscriptionHistory(req, res, next) {
    try {
      const companyId = req.query.companyId || req.user?.companyId;
      const data = await subscriptionsService.getSubscriptionHistory(companyId);
      res.status(200).json({ status: 'SUCCESS', data });
    } catch (err) {
      next(err);
    }
  },

  async getSubscriptionStats(req, res, next) {
    try {
      const companyId = req.query.companyId || req.user?.companyId;
      const data = await subscriptionsService.getSubscriptionStats(companyId);
      res.status(200).json({ status: 'SUCCESS', data });
    } catch (err) {
      next(err);
    }
  },

  async checkExpiry(req, res, next) {
    try {
      const companyId = req.query.companyId || req.user?.companyId;
      const data = await subscriptionsService.checkSubscriptionExpiry(companyId);
      res.status(200).json({ status: 'SUCCESS', data });
    } catch (err) {
      next(err);
    }
  },

  async createPlan(req, res, next) {
    try {
      const plan = await subscriptionsService.createPlan(req.body);
      res.status(201).json({ status: 'SUCCESS', data: plan });
    } catch (err) {
      next(err);
    }
  },

  async updatePlan(req, res, next) {
    try {
      const plan = await subscriptionsService.updatePlan(req.params.id, req.body);
      res.status(200).json({ status: 'SUCCESS', data: plan });
    } catch (err) {
      next(err);
    }
  },

  async startTrial(req, res, next) {
    try {
      const companyId = req.body.companyId || req.user?.companyId || req.user?.company?.id;
      const sub = await subscriptionsService.startTrial({ companyId, planId: req.body.planId });
      res.status(201).json({ status: 'SUCCESS', message: '14-Day Free Trial initiated', data: sub });
    } catch (err) {
      next(err);
    }
  },

  async convertTrial(req, res, next) {
    try {
      const companyId = req.body.companyId || req.user?.companyId || req.user?.company?.id;
      const sub = await subscriptionsService.convertTrialToPaid({
        companyId,
        planId: req.body.planId,
        paymentId: req.body.paymentId,
      });
      res.status(200).json({ status: 'SUCCESS', message: 'Trial converted to active subscription', data: sub });
    } catch (err) {
      next(err);
    }
  },

  async extendTrial(req, res, next) {
    try {
      const companyId = req.body.companyId || req.user?.companyId || req.user?.company?.id;
      const result = await subscriptionsService.extendTrial({
        companyId,
        days: req.body.days,
        extendedBy: req.user?.id,
      });
      res.status(200).json({ status: 'SUCCESS', message: 'Trial period extended', data: result });
    } catch (err) {
      next(err);
    }
  },

  async cancelTrial(req, res, next) {
    try {
      const companyId = req.body.companyId || req.user?.companyId || req.user?.company?.id;
      const result = await subscriptionsService.cancelTrial({
        companyId,
        reason: req.body.reason,
      });
      res.status(200).json({ status: 'SUCCESS', message: 'Trial cancelled', data: result });
    } catch (err) {
      next(err);
    }
  },

  async calculateProration(req, res, next) {
    try {
      const { calculateProration } = await import('../../services/proration.service.js');
      const companyId = req.body.companyId || req.user?.companyId;
      const sub = companyId ? await subscriptionsService.getCurrentSubscription(companyId) : null;
      const result = await calculateProration({
        subscriptionId: sub?.id,
        companyId,
        newPlanId: req.body.newPlanId,
        changeType: req.body.changeType || 'UPGRADE'
      });
      res.status(200).json({ status: 'SUCCESS', data: result });
    } catch (err) {
      next(err);
    }
  },

  async applyProration(req, res, next) {
    try {
      const { applyProration } = await import('../../services/proration.service.js');
      const companyId = req.body.companyId || req.user?.companyId;
      const sub = companyId ? await subscriptionsService.getCurrentSubscription(companyId) : null;
      const result = await applyProration({
        subscriptionId: sub?.id,
        companyId,
        newPlanId: req.body.newPlanId,
        changeType: req.body.changeType || 'UPGRADE'
      });
      res.status(200).json({ status: 'SUCCESS', message: 'Proration applied successfully', data: result });
    } catch (err) {
      next(err);
    }
  }
};
