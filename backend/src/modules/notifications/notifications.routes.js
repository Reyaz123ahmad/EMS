import { Router } from 'express';
import controller from './notifications.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.listNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.put('/read-all', controller.markAllAsRead);
router.put('/:id/read', controller.markAsRead);
router.delete('/:id', controller.deleteNotification);
router.post('/', controller.createNotification);

export default router;
