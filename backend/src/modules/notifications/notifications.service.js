import { prisma } from '../../config/prisma.js';
import repository from './notifications.repository.js';
import socketService from '../../services/socket.service.js';
import { emailQueue } from '../../queues/email.queue.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from './notifications.constants.js';
import logger from '../../config/logger.js';

export const createNotification = async ({ userId, title, body, type = NOTIFICATION_TYPES.SYSTEM, priority = NOTIFICATION_PRIORITY.MEDIUM, metadata = null }) => {
  const notification = await repository.createNotification({
    userId,
    title,
    body,
    type,
    priority,
    metadata
  });

  // Emit Socket.io event to user
  try {
    socketService.emitToUser(userId, 'notification:new', notification);
    const unreadCount = await repository.getUnreadCount(userId);
    socketService.emitToUser(userId, 'notification:unread_count', { count: unreadCount });
  } catch (socketErr) {
    logger.warn({ error: socketErr.message }, 'Failed to emit socket notification');
  }

  // Queue email if priority HIGH or URGENT
  if (priority === NOTIFICATION_PRIORITY.HIGH || priority === NOTIFICATION_PRIORITY.URGENT) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      if (user?.email) {
        await emailQueue.add('send-notification', {
          to: user.email,
          subject: `[${priority}] ${title}`,
          body,
          html: `<div style="font-family:sans-serif;padding:20px;border-left:4px solid #3b82f6;"><h3>${title}</h3><p>${body}</p></div>`
        });
      }
    } catch (queueErr) {
      logger.warn({ error: queueErr.message }, 'Failed to queue email for notification');
    }
  }

  return notification;
};

export const createBulkNotifications = async ({ userIds = [], title, body, type = NOTIFICATION_TYPES.ANNOUNCEMENT, priority = NOTIFICATION_PRIORITY.MEDIUM, metadata = null }) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { count: 0 };
  }

  const items = userIds.map((userId) => ({
    userId,
    title,
    body,
    type,
    priority,
    metadata
  }));

  const result = await repository.createBulkNotifications(items);

  // Emit to users via socket
  userIds.forEach((userId) => {
    try {
      socketService.emitToUser(userId, 'notification:new', {
        title,
        body,
        type,
        priority,
        metadata,
        createdAt: new Date().toISOString(),
        isRead: false
      });
    } catch (e) {
      // ignore
    }
  });

  return result;
};

export const listNotifications = async (userId, filters = {}, pagination = { page: 1, limit: 20 }) => {
  return await repository.findNotifications(userId, filters, pagination);
};

export const markAsRead = async (id, userId) => {
  const result = await repository.markAsRead(id, userId);
  const unreadCount = await repository.getUnreadCount(userId);
  socketService.emitToUser(userId, 'notification:unread_count', { count: unreadCount });
  return result;
};

export const markAllAsRead = async (userId) => {
  const result = await repository.markAllAsRead(userId);
  socketService.emitToUser(userId, 'notification:unread_count', { count: 0 });
  return result;
};

export const deleteNotification = async (id, userId) => {
  const result = await repository.deleteNotification(id, userId);
  const unreadCount = await repository.getUnreadCount(userId);
  socketService.emitToUser(userId, 'notification:unread_count', { count: unreadCount });
  return result;
};

export const getUnreadCount = async (userId) => {
  return await repository.getUnreadCount(userId);
};

export const sendAttendanceNotification = async ({ employeeId, type, data = {} }) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true, firstName: true, lastName: true }
  });
  if (!employee?.userId) return null;

  return await createNotification({
    userId: employee.userId,
    title: `Attendance Update: ${type || 'Record Updated'}`,
    body: data.message || `Your attendance record has been updated.`,
    type: NOTIFICATION_TYPES.ATTENDANCE,
    priority: NOTIFICATION_PRIORITY.MEDIUM,
    metadata: data
  });
};

export const sendLeaveNotification = async ({ employeeId, type, data = {} }) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true, firstName: true, lastName: true }
  });
  if (!employee?.userId) return null;

  return await createNotification({
    userId: employee.userId,
    title: `Leave Status: ${type || 'Status Changed'}`,
    body: data.message || `Your leave request status has been updated.`,
    type: NOTIFICATION_TYPES.LEAVE,
    priority: NOTIFICATION_PRIORITY.HIGH,
    metadata: data
  });
};

export const sendPayrollNotification = async ({ employeeId, type, data = {} }) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true, firstName: true, lastName: true }
  });
  if (!employee?.userId) return null;

  return await createNotification({
    userId: employee.userId,
    title: `Payroll Notification: ${type || 'Payslip Available'}`,
    body: data.message || `Your payslip or payroll item is now accessible.`,
    type: NOTIFICATION_TYPES.PAYROLL,
    priority: NOTIFICATION_PRIORITY.HIGH,
    metadata: data
  });
};

export const sendSecurityNotification = async ({ userId, type, data = {} }) => {
  const notif = await createNotification({
    userId,
    title: `Security Alert: ${type || 'Unusual Activity'}`,
    body: data.message || `A security alert occurred on your account.`,
    type: NOTIFICATION_TYPES.SECURITY,
    priority: NOTIFICATION_PRIORITY.URGENT,
    metadata: data
  });

  socketService.emitToUser(userId, 'security:alert', {
    type,
    ...data,
    createdAt: new Date().toISOString()
  });

  return notif;
};

export const sendApprovalNotification = async ({ approverId, type, data = {} }) => {
  return await createNotification({
    userId: approverId,
    title: `Approval Required: ${type || 'New Request'}`,
    body: data.message || `You have a pending approval request.`,
    type: NOTIFICATION_TYPES.APPROVAL,
    priority: NOTIFICATION_PRIORITY.HIGH,
    metadata: data
  });
};

export const sendAadhaarOTPSentNotification = async ({ employeeId, transactionId }) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true, firstName: true, lastName: true }
  });
  if (!employee?.userId) return null;

  return await createNotification({
    userId: employee.userId,
    title: 'Aadhaar OTP Sent',
    body: `UIDAI has sent a verification OTP for transaction ${transactionId}. Valid for 10 minutes.`,
    type: NOTIFICATION_TYPES.DOCUMENT,
    priority: NOTIFICATION_PRIORITY.HIGH,
    metadata: { transactionId, employeeId }
  });
};

export const sendAadhaarVerifiedNotification = async ({ employeeId, hrUserId, transactionId, maskedAadhaar }) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true, firstName: true, lastName: true, employeeCode: true }
  });

  const empName = employee ? `${employee.firstName} ${employee.lastName}` : 'Employee';

  // Notify employee
  if (employee?.userId) {
    await createNotification({
      userId: employee.userId,
      title: 'Aadhaar Verified Successfully',
      body: `Your Aadhaar card (${maskedAadhaar || 'XXXX-XXXX-1234'}) has been verified via UIDAI.`,
      type: NOTIFICATION_TYPES.DOCUMENT,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: { transactionId, employeeId }
    });
  }

  // Notify HR if specified
  if (hrUserId) {
    await createNotification({
      userId: hrUserId,
      title: 'Aadhaar Verification Completed',
      body: `${empName} (${employee?.employeeCode || 'N/A'}) has verified Aadhaar via UIDAI OTP.`,
      type: NOTIFICATION_TYPES.DOCUMENT,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: { transactionId, employeeId }
    });
  }
};

export const sendAadhaarDemoUploadNotification = async ({ employeeId, hrUserId, maskedAadhaar }) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true, firstName: true, lastName: true, employeeCode: true }
  });

  const empName = employee ? `${employee.firstName} ${employee.lastName}` : 'Employee';

  // Notify employee
  if (employee?.userId) {
    await createNotification({
      userId: employee.userId,
      title: 'Aadhaar Uploaded (Demo Mode)',
      body: `Your Aadhaar card (${maskedAadhaar || 'XXXX-XXXX-1234'}) has been uploaded and is pending HR review.`,
      type: NOTIFICATION_TYPES.DOCUMENT,
      priority: NOTIFICATION_PRIORITY.LOW,
      metadata: { employeeId }
    });
  }

  // Notify HR
  if (hrUserId) {
    await createNotification({
      userId: hrUserId,
      title: 'Aadhaar Document Uploaded (Demo)',
      body: `${empName} has uploaded an Aadhaar document in demo mode. Manual review required.`,
      type: NOTIFICATION_TYPES.DOCUMENT,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      metadata: { employeeId }
    });
  }
};

export default {
  createNotification,
  createBulkNotifications,
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendAttendanceNotification,
  sendLeaveNotification,
  sendPayrollNotification,
  sendSecurityNotification,
  sendApprovalNotification,
  sendAadhaarOTPSentNotification,
  sendAadhaarVerifiedNotification,
  sendAadhaarDemoUploadNotification
};
