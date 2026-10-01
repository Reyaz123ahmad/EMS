import { Router } from 'express';
import tasksController from './tasks.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';
import { cacheResponse } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Tasks query & creation
router.get('/', cacheResponse('cache:tasks_list', 60), tasksController.listTasks);
router.post('/', tasksController.createTask);
router.get('/:id', cacheResponse('cache:tasks_detail', 60), tasksController.getTaskDetail);

// Task progress & comments
router.put('/:id/progress', tasksController.updateTaskProgress);
router.post('/:id/comments', tasksController.addTaskComment);

export default router;
