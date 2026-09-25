import { Router } from 'express';
import * as healthController from './health.controller.js';

const router = Router();

router.get('/', healthController.getHealth);
router.get('/db', healthController.getDbHealth);
router.get('/redis', healthController.getRedisHealth);
router.get('/queues', healthController.getQueuesHealth);
router.get('/storage', healthController.getStorageHealth);
router.get('/email', healthController.getEmailHealth);

export default router;
