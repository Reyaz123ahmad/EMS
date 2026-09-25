import { getIO } from '../config/socket.js';
import logger from '../config/logger.js';

export const emitToUser = (userId, event, data) => {
  const io = getIO();
  if (!io) {
    logger.debug({ userId, event }, 'Socket server not initialized, skipping emitToUser');
    return false;
  }
  io.to(`user:${userId}`).emit(event, data);
  logger.debug({ userId, event }, 'Emitted socket event to user');
  return true;
};

export const emitToCompany = (companyId, event, data) => {
  const io = getIO();
  if (!io) {
    logger.debug({ companyId, event }, 'Socket server not initialized, skipping emitToCompany');
    return false;
  }
  io.to(`company:${companyId}`).emit(event, data);
  logger.debug({ companyId, event }, 'Emitted socket event to company');
  return true;
};

export const emitToRole = (companyId, role, event, data) => {
  const io = getIO();
  if (!io) {
    logger.debug({ companyId, role, event }, 'Socket server not initialized, skipping emitToRole');
    return false;
  }
  if (companyId) {
    io.to(`company:${companyId}:role:${role}`).emit(event, data);
  } else {
    io.to(`role:${role}`).emit(event, data);
  }
  logger.debug({ companyId, role, event }, 'Emitted socket event to role');
  return true;
};

export const broadcast = (event, data) => {
  const io = getIO();
  if (!io) {
    logger.debug({ event }, 'Socket server not initialized, skipping broadcast');
    return false;
  }
  io.emit(event, data);
  logger.debug({ event }, 'Broadcasted socket event to all clients');
  return true;
};

export default {
  emitToUser,
  emitToCompany,
  emitToRole,
  broadcast
};
