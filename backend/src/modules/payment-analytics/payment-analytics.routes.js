import { Router } from 'express';
import * as controller from './payment-analytics.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'));

router.get('/revenue', controller.getRevenueStats);
router.get('/mrr', controller.getMRR);
router.get('/arr', controller.getARR);
router.get('/churn', controller.getChurnRate);
router.get('/success-rate', controller.getPaymentSuccessRate);
router.get('/refund-rate', controller.getRefundRate);
router.get('/payment-methods', controller.getPaymentMethodStats);
router.get('/revenue-by-plan', controller.getRevenueByPlan);

export default router;
