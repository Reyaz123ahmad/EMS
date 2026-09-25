import { Router } from 'express';
import * as controller from './coupons.controller.js';
import * as validator from './coupons.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate);

// Public validation/apply for company admins during checkout
router.post('/validate', validate(validator.validateCouponSchema), controller.validateCoupon);
router.post('/apply', validate(validator.applyCouponSchema), controller.applyCoupon);

// Super Admin Management
router.get('/', requireRole('SUPER_ADMIN'), controller.listCoupons);
router.post('/', requireRole('SUPER_ADMIN'), validate(validator.createCouponSchema), controller.createCoupon);
router.get('/stats', requireRole('SUPER_ADMIN'), controller.getStats);
router.put('/:id', requireRole('SUPER_ADMIN'), validate(validator.updateCouponSchema), controller.updateCoupon);
router.delete('/:id', requireRole('SUPER_ADMIN'), controller.deleteCoupon);

export default router;
