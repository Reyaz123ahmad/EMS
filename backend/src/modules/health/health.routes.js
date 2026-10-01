import { Router } from 'express';
import * as healthController from './health.controller.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.get('/', cacheResponse('cache:health_root', 60), healthController.getHealth);
router.get('/db', cacheResponse('cache:health_db', 60), healthController.getDbHealth);
router.get('/redis', cacheResponse('cache:health_redis', 60), healthController.getRedisHealth);
router.get('/queues', cacheResponse('cache:health_queues', 60), healthController.getQueuesHealth);
router.get('/storage', cacheResponse('cache:health_storage', 60), healthController.getStorageHealth);
router.get('/email', cacheResponse('cache:health_email', 60), healthController.getEmailHealth);

export default router;
