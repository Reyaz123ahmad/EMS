import { Router } from 'express';
import rostersController from './rosters.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

router.get('/calendar', cacheResponse('cache:rosters:calendar', 300), rostersController.getCalendar);
router.get('/', cacheResponse('cache:rosters:list', 300), rostersController.list);
router.post('/generate', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), rostersController.generate);
router.post('/publish', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), rostersController.publish);
router.post('/bulk-assign', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), rostersController.bulkAssign);
router.put('/:id', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), rostersController.update);
router.delete('/:id', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN'), rostersController.delete);
router.post('/:id/publish', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN'), rostersController.publish);

export default router;
