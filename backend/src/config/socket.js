import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { env } from './env.js';
import { prisma } from './prisma.js';
import logger from './logger.js';

let ioInstance = null;
let pubClient = null;
let subClient = null;

/**
 * Initializes Redis Pub/Sub clients and attaches Redis adapter to Socket.io
 */
const setupRedisAdapter = async (io) => {
  const redisUrl = env.REDIS_URL || 'redis://127.0.0.1:6379';

  try {
    pubClient = createClient({ url: redisUrl });
    subClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      logger.error({ err: err.message }, 'Socket.io Redis PubClient Error');
    });

    subClient.on('error', (err) => {
      logger.error({ err: err.message }, 'Socket.io Redis SubClient Error');
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.io Redis adapter attached successfully for multi-instance cluster');
  } catch (error) {
    logger.warn({ error: error.message }, 'Failed to initialize Socket.io Redis adapter. Falling back to in-memory adapter.');
  }
};

export const initSocket = async (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Attach Redis cluster adapter
  await setupRedisAdapter(ioInstance);

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
      const userId = decoded.userId || decoded.sub || decoded.id;
      if (!decoded || !userId) {
        return next(new Error('Authentication error: Invalid token payload'));
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
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

      const roles = (user.userRoles && user.userRoles.length > 0)
        ? user.userRoles.map((ur) => ur.role?.name || ur.role)
        : [user.role || decoded.role || 'USER'];

      socket.user = {
        id: user.id,
        email: user.email,
        companyId: user.companyId || null,
        roles: roles.filter(Boolean)
      };

      next();
    } catch (error) {
      logger.warn({ error: error.message }, 'Socket.io auth failed');
      return next(new Error(`Authentication error: ${error.message}`));
    }
  });

  ioInstance.on('connection', (socket) => {
    const user = socket.user;
    logger.info({ socketId: socket.id, userId: user?.id, instance: process.env.INSTANCE_ID }, 'Socket client connected');

    if (user?.id) {
      // Join user specific room
      socket.join(`user:${user.id}`);

      // Join global role rooms
      if (Array.isArray(user.roles)) {
        user.roles.forEach((role) => {
          if (role) socket.join(`role:${role}`);
        });
      }

      // Join company specific room & company role rooms if company exists
      if (user.companyId) {
        socket.join(`company:${user.companyId}`);
        if (Array.isArray(user.roles)) {
          user.roles.forEach((role) => {
            if (role) socket.join(`company:${user.companyId}:role:${role}`);
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

/**
 * Gracefully close Redis adapter pub/sub clients
 */
export const closeSocketClients = async () => {
  try {
    if (pubClient && pubClient.isOpen) {
      await pubClient.quit();
      logger.info('Socket.io Redis pubClient closed');
    }
    if (subClient && subClient.isOpen) {
      await subClient.quit();
      logger.info('Socket.io Redis subClient closed');
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Error closing Socket.io Redis adapter clients');
  }
};

export default {
  initSocket,
  getIO,
  closeSocketClients
};
