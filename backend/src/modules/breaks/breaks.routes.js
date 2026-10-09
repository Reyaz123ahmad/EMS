import { Router } from 'express';
import breaksController from './breaks.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// List all break rules for the company (COMPANY_ADMIN only)
router.get('/', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN'), breaksController.list);

// Get single break rule details
router.get('/:id', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN', 'HR_ADMIN'), breaksController.getById);

// Create new break rule (COMPANY_ADMIN only)
router.post('/', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'), breaksController.create);

// Update break rule (COMPANY_ADMIN only)
router.put('/:id', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'), breaksController.update);

// Soft delete / deactivate break rule (COMPANY_ADMIN only)
router.delete('/:id', requireRole('COMPANY_ADMIN', 'SUPER_ADMIN'), breaksController.delete);

export default router;
