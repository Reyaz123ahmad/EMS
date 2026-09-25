import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env.js';
import { prisma } from './prisma.js';
import logger from './logger.js';

let ioInstance = null;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // JWT Authentication Middleware for Socket.io
  ioInstance.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
      }
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      if (!decoded || !decoded.userId) {
        return next(new Error('Authentication error: Invalid token payload'));
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        return next(new Error('Authentication error: User not active or not found'));
      }

      socket.user = {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        roles: user.userRoles.map((ur) => ur.role.name)
      };

      next();
    } catch (error) {
      logger.warn({ error: error.message }, 'Socket.io auth failed');
      return next(new Error(`Authentication error: ${error.message}`));
    }
  });

  ioInstance.on('connection', (socket) => {
    const user = socket.user;
    logger.info({ socketId: socket.id, userId: user?.id }, 'Socket client connected');

    if (user?.id) {
      // Join user specific room
      socket.join(`user:${user.id}`);

      // Join company specific room
      if (user.companyId) {
        socket.join(`company:${user.companyId}`);
        // Join role specific rooms within company
        if (Array.isArray(user.roles)) {
          user.roles.forEach((role) => {
            socket.join(`role:${role}`);
            socket.join(`company:${user.companyId}:role:${role}`);
          });
        }
      }
    }

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, userId: user?.id, reason }, 'Socket client disconnected');
    });
  });

  return ioInstance;
};

export const getIO = () => {
  return ioInstance;
};

export default {
  initSocket,
  getIO
};
