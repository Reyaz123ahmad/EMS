import { prisma } from '../../config/prisma.js';

export const createNotification = async (data) => {
  return await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      body: data.body,
      type: data.type || 'SYSTEM',
      priority: data.priority || 'MEDIUM',
      metadata: data.metadata || null
    }
  });
};

export const createBulkNotifications = async (dataArray) => {
  return await prisma.notification.createMany({
    data: dataArray.map((item) => ({
      userId: item.userId,
      title: item.title,
      body: item.body,
      type: item.type || 'ANNOUNCEMENT',
      priority: item.priority || 'MEDIUM',
      metadata: item.metadata || null
    }))
  });
};

export const findNotifications = async (userId, filters = {}, pagination = { page: 1, limit: 20 }) => {
  const where = { userId };

  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (typeof filters.isRead === 'boolean') {
    where.isRead = filters.isRead;
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.notification.count({ where })
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const findNotificationById = async (id) => {
  return await prisma.notification.findUnique({
    where: { id }
  });
};

export const markAsRead = async (id, userId) => {
  return await prisma.notification.updateMany({
    where: { id, userId },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
};

export const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
};

export const deleteNotification = async (id, userId) => {
  return await prisma.notification.deleteMany({
    where: { id, userId }
  });
};

export const getUnreadCount = async (userId) => {
  return await prisma.notification.count({
    where: { userId, isRead: false }
  });
};

export const deleteOldNotifications = async (daysOld = 30) => {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysOld);

  return await prisma.notification.deleteMany({
    where: {
      createdAt: {
        lt: thresholdDate
      },
      isRead: true
    }
  });
};

export default {
  createNotification,
  createBulkNotifications,
  findNotifications,
  findNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  deleteOldNotifications
};
