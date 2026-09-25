import service from './notifications.service.js';
import { createNotificationSchema, notificationFiltersSchema } from './notifications.validator.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const listNotifications = async (req, res, next) => {
  try {
    const { error, value } = notificationFiltersSchema.validate(req.query);
    if (error) {
      return sendError(res, error.details[0].message, 400);
    }

    const { page, limit, ...filters } = value;
    const result = await service.listNotifications(req.user.id, filters, { page, limit });

    return sendSuccess(res, result, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await service.getUnreadCount(req.user.id);
    return sendSuccess(res, { unreadCount: count }, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await service.markAsRead(id, req.user.id);
    return sendSuccess(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await service.markAllAsRead(req.user.id);
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await service.deleteNotification(id, req.user.id);
    return sendSuccess(res, null, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (req, res, next) => {
  try {
    const { error, value } = createNotificationSchema.validate(req.body);
    if (error) {
      return sendError(res, error.details[0].message, 400);
    }

    const notification = await service.createNotification(value);
    return sendSuccess(res, notification, 'Notification created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export default {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};
