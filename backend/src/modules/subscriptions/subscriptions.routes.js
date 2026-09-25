import { Router } from 'express';
import { subscriptionsController } from './subscriptions.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createOrderSchema,
  verifyPaymentSchema,
  renewSubscriptionSchema,
  cancelSubscriptionSchema,
  planSchema,
} from './subscriptions.validator.js';

const router = Router();

// Public plan listing
router.get('/', subscriptionsController.getPlans);
router.get('/plans', subscriptionsController.getPlans);
router.post('/plans', validate(planSchema), subscriptionsController.createPlan);
router.put('/plans/:id', validate(planSchema), subscriptionsController.updatePlan);

// Protected subscription routes
router.use(authenticate);
router.get('/current', subscriptionsController.getCurrentSubscription);
router.post('/orders', validate(createOrderSchema), subscriptionsController.createOrder);
router.post('/verify', validate(verifyPaymentSchema), subscriptionsController.verifyPayment);
router.post('/renew', validate(renewSubscriptionSchema), subscriptionsController.renewSubscription);
router.post('/cancel', validate(cancelSubscriptionSchema), subscriptionsController.cancelSubscription);
router.get('/history', subscriptionsController.getSubscriptionHistory);
router.get('/stats', subscriptionsController.getSubscriptionStats);
router.get('/check-expiry', subscriptionsController.checkExpiry);

// Proration calculations
router.post('/proration/calculate', subscriptionsController.calculateProration);
router.post('/proration/apply', subscriptionsController.applyProration);

// Trial management
router.post('/trial/start', subscriptionsController.startTrial);
router.post('/trial/convert', subscriptionsController.convertTrial);
router.post('/trial/extend', subscriptionsController.extendTrial);
router.post('/trial/cancel', subscriptionsController.cancelTrial);

export default router;
