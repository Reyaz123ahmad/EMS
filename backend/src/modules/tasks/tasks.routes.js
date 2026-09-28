import { Router } from 'express';
import tasksController from './tasks.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireActiveSubscription);

// Tasks query
router.get('/', tasksController.listTasks);
router.get('/:id', tasksController.getTaskDetail);

// Task progress & comments
router.put('/:id/progress', tasksController.updateTaskProgress);
router.post('/:id/comments', tasksController.addTaskComment);

export default router;
