import { Router } from 'express';
import branchesController from './branches.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), branchesController.getStats);
router.post('/bulk-import', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), branchesController.bulkImport);
router.get('/', branchesController.list);
router.get('/:id', branchesController.get);
router.post('/', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), branchesController.create);
router.put('/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), branchesController.update);
router.delete('/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), branchesController.delete);

export default router;
