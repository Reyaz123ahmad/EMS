import { Router } from 'express';
import { subscriptionsController } from './subscriptions.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createOrderSchema,
  verifyPaymentSchema,
  renewSubscriptionSchema,
  cancelSubscriptionSchema,
  planSchema,
} from './subscriptions.validator.js';

import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

// Public / Authenticated plan listing
router.get('/', cacheResponse('cache:plans', 300), subscriptionsController.getPlans);
router.get('/plans', cacheResponse('cache:plans', 300), subscriptionsController.getPlans);

// Super Admin plan management
router.post('/', authenticate, requireRole('SUPER_ADMIN'), validate(planSchema), subscriptionsController.createPlan);
router.post('/plans', authenticate, requireRole('SUPER_ADMIN'), validate(planSchema), subscriptionsController.createPlan);
router.put('/:id', authenticate, requireRole('SUPER_ADMIN'), validate(planSchema), subscriptionsController.updatePlan);
router.put('/plans/:id', authenticate, requireRole('SUPER_ADMIN'), validate(planSchema), subscriptionsController.updatePlan);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), subscriptionsController.deletePlan);
router.delete('/plans/:id', authenticate, requireRole('SUPER_ADMIN'), subscriptionsController.deletePlan);

// Protected subscription routes
router.use(authenticate);
router.get('/platform-status', cacheResponse('cache:sub_platform_status', 120), subscriptionsController.getPlatformStatus);
router.get('/current', cacheResponse('cache:sub_current', 60), subscriptionsController.getCurrentSubscription);
router.post('/orders', validate(createOrderSchema), subscriptionsController.createOrder);
router.post('/verify', validate(verifyPaymentSchema), subscriptionsController.verifyPayment);
router.post('/renew', validate(renewSubscriptionSchema), subscriptionsController.renewSubscription);
router.post('/cancel', validate(cancelSubscriptionSchema), subscriptionsController.cancelSubscription);
router.get('/history', cacheResponse('cache:sub_history', 60), subscriptionsController.getSubscriptionHistory);
router.get('/stats', cacheResponse('cache:sub_stats', 120), subscriptionsController.getSubscriptionStats);
router.get('/check-expiry', cacheResponse('cache:sub_expiry', 60), subscriptionsController.checkExpiry);

// Proration calculations
router.post('/proration/calculate', subscriptionsController.calculateProration);
router.post('/proration/apply', subscriptionsController.applyProration);

// Trial management
router.post('/trial/start', subscriptionsController.startTrial);
router.post('/trial/convert', subscriptionsController.convertTrial);
router.post('/trial/extend', subscriptionsController.extendTrial);
router.post('/trial/cancel', subscriptionsController.cancelTrial);

export default router;
