import { Router } from 'express';
import { biometricDevicesController } from './biometric-devices.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireActiveSubscription, requireFeature, checkSubscriptionLimit } from '../../middlewares/subscription.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);
router.use(requireRole('HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'));
router.use(requireFeature('attendance.finger'));

router.get('/', cacheResponse('cache:bio_devices_list', 60), biometricDevicesController.listDevices);
router.post('/', checkSubscriptionLimit('maxDevices'), biometricDevicesController.createDevice);
router.get('/:id', cacheResponse('cache:bio_devices_detail', 60), biometricDevicesController.getDevice);
router.put('/:id', biometricDevicesController.updateDevice);
router.delete('/:id', biometricDevicesController.deactivateDevice);
router.post('/:id/regenerate-key', biometricDevicesController.regenerateApiKey);
router.get('/:id/status', cacheResponse('cache:bio_devices_status', 60), biometricDevicesController.getStatus);

export default router;
