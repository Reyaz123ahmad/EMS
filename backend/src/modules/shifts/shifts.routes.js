import { Router } from 'express';
import shiftsController from './shifts.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

router.get('/stats', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), shiftsController.getStats);
router.get('/my-shift', shiftsController.getMyShift);
router.get('/effective-shift', shiftsController.getEffectiveShift);
router.get('/effective-shift/:employeeId', requireRole('COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'SUPER_ADMIN'), shiftsController.getEffectiveShift);
router.get('/', shiftsController.list);
router.get('/:id', shiftsController.getById);
router.post('/', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), shiftsController.create);
router.put('/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), shiftsController.update);
router.delete('/:id', requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), shiftsController.delete);
router.post('/assign', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), shiftsController.assign);
router.delete('/assignments/:id', requireRole('HR_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'), shiftsController.removeAssignment);

export default router;
