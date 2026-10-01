import { Router } from 'express';
import controller from './notifications.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../../middlewares/cache.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', cacheResponse('cache:notifications', 30), controller.listNotifications);
router.get('/unread-count', cacheResponse('cache:notif_unread', 30), controller.getUnreadCount);
router.put('/read-all', async (req, res, next) => {
  await invalidateCache('cache:notifications');
  await invalidateCache('cache:notif_unread');
  next();
}, controller.markAllAsRead);
router.put('/:id/read', async (req, res, next) => {
  await invalidateCache('cache:notifications');
  await invalidateCache('cache:notif_unread');
  next();
}, controller.markAsRead);
router.delete('/:id', async (req, res, next) => {
  await invalidateCache('cache:notifications');
  await invalidateCache('cache:notif_unread');
  next();
}, controller.deleteNotification);
router.post('/', async (req, res, next) => {
  await invalidateCache('cache:notifications');
  await invalidateCache('cache:notif_unread');
  next();
}, controller.createNotification);

export default router;
