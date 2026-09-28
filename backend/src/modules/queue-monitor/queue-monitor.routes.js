import { Router } from 'express';
import { queueMonitorController } from './queue-monitor.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { cleanQueueSchema } from './queue-monitor.validator.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN'));

router.get('/stats', cacheResponse('cache:queue_stats', 15), queueMonitorController.getStats);
router.get('/health', queueMonitorController.getHealth);
router.get('/:queue/jobs', queueMonitorController.getJobs);
router.post('/:queue/:jobId/retry', queueMonitorController.retryJob);
router.delete('/:queue/:jobId', queueMonitorController.removeJob);
router.post('/:queue/pause', queueMonitorController.pauseQueue);
router.post('/:queue/resume', queueMonitorController.resumeQueue);
router.post('/:queue/clean', validate(cleanQueueSchema), queueMonitorController.cleanQueue);

export default router;
