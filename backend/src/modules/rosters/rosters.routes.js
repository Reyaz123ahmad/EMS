import { Router } from 'express';
import rostersController from './rosters.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

router.get('/calendar', rostersController.getCalendar);
router.get('/', rostersController.list);
router.post('/generate', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), rostersController.generate);
router.post('/publish', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), rostersController.publish);
router.post('/bulk-assign', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), rostersController.bulkAssign);

export default router;
