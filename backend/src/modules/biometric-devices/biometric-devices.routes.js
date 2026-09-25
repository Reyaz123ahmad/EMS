import { Router } from 'express';
import { biometricDevicesController } from './biometric-devices.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription, requireFeature } from '../../middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);
router.use(requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'));
router.use(requireFeature('attendance.finger'));

router.get('/', biometricDevicesController.listDevices);
router.post('/', biometricDevicesController.createDevice);
router.get('/:id', biometricDevicesController.getDevice);
router.put('/:id', biometricDevicesController.updateDevice);
router.delete('/:id', biometricDevicesController.deactivateDevice);
router.post('/:id/regenerate-key', biometricDevicesController.regenerateApiKey);
router.get('/:id/status', biometricDevicesController.getStatus);

export default router;
