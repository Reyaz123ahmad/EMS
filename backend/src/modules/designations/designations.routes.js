import { Router } from 'express';
import designationsController from './designations.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), cacheResponse('cache:designations_stats', 120), designationsController.getStats);
router.post('/bulk-import', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), designationsController.bulkImport);
router.get('/', cacheResponse('cache:designations_list', 120), designationsController.list);
router.get('/:id', designationsController.get);
router.post('/', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), designationsController.create);
router.put('/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), designationsController.update);
router.delete('/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), designationsController.delete);

export default router;
