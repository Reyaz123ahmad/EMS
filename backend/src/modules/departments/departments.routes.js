import { Router } from 'express';
import departmentsController from './departments.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), departmentsController.getStats);
router.post('/bulk-import', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), departmentsController.bulkImport);
router.get('/', departmentsController.list);
router.get('/:id', departmentsController.get);
router.post('/', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), departmentsController.create);
router.put('/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), departmentsController.update);
router.delete('/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), departmentsController.delete);

export default router;
