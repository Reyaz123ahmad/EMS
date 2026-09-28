import { Router } from 'express';
import * as controller from './payment-analytics.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'));

router.get('/revenue', cacheResponse('cache:pay_rev', 120), controller.getRevenueStats);
router.get('/mrr', cacheResponse('cache:pay_mrr', 120), controller.getMRR);
router.get('/arr', cacheResponse('cache:pay_arr', 120), controller.getARR);
router.get('/churn', cacheResponse('cache:pay_churn', 120), controller.getChurnRate);
router.get('/success-rate', cacheResponse('cache:pay_success', 120), controller.getPaymentSuccessRate);
router.get('/refund-rate', cacheResponse('cache:pay_refund', 120), controller.getRefundRate);
router.get('/refunds', cacheResponse('cache:pay_refunds', 120), controller.getRefundRate);
router.get('/payment-methods', cacheResponse('cache:pay_methods', 120), controller.getPaymentMethodStats);
router.get('/revenue-by-plan', cacheResponse('cache:pay_rev_plan', 120), controller.getRevenueByPlan);

export default router;
