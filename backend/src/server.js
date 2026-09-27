import http from 'http';
import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import redis from './config/redis.js';
import prisma from './config/prisma.js';
import { bootstrap } from './bootstrap.js';
import { initSocket, getIO, closeSocketClients } from './config/socket.js';
import { startAllWorkers, closeAllWorkers } from './workers/index.js';
import { closeAllQueues } from './queues/index.js';
import { loadModels as loadFaceModels } from './services/face.service.js';

let server;
let httpServer;
let isShuttingDown = false;

async function startServer() {
  try {
    await bootstrap();
    await loadFaceModels();

    // In development mode (or if standalone worker not deployed), run workers in-process
    if (env.NODE_ENV !== 'production' && !process.env.WORKER_ID) {
      logger.info('Starting in-process BullMQ workers for development environment...');
      startAllWorkers();
    }

    const PORT = process.env.PORT || env.PORT || 5000;
    httpServer = http.createServer(app);

    // Initialize Socket.io with Redis Pub/Sub adapter
    await initSocket(httpServer);

    server = httpServer.listen(PORT, () => {
      logger.info({ port: PORT, instance: process.env.INSTANCE_ID || 'standalone' }, `EMS Backend server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);

      // Inform PM2 that the process is ready to receive requests (for zero-downtime reloads)
      if (process.send) {
        process.send('ready');
        logger.info('Sent ready signal to PM2 master process');
      }
    });

    const shutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      logger.info({ signal }, `Received ${signal}. Initiating graceful shutdown sequence...`);

      // 1. Force shutdown timer fallback (30 seconds maximum)
      const forceExitTimer = setTimeout(() => {
        logger.error('Graceful shutdown timed out after 30s. Forcing exit.');
        process.exit(1);
      }, 30000);
      forceExitTimer.unref();

      // 2. Stop accepting new HTTP connections
      if (server) {
        await new Promise((resolve) => {
          server.close((err) => {
            if (err) {
              logger.warn({ err: err.message }, 'Error while closing HTTP server');
            } else {
              logger.info('1. HTTP server closed. No longer accepting new connections.');
            }
            resolve();
          });
        });
      }

      // 3. Close active Socket.io connections & Redis adapter clients
      try {
        const io = getIO();
        if (io) {
          io.close();
          logger.info('2. Socket.io server connections terminated.');
        }
        await closeSocketClients();
      } catch (err) {
        logger.warn({ err: err.message }, 'Error closing Socket.io connections');
      }

      // 4. Close BullMQ workers & Queues
      try {
        await closeAllWorkers();
        logger.info('3. BullMQ workers stopped.');
        await closeAllQueues();
        logger.info('4. BullMQ queues closed.');
      } catch (err) {
        logger.warn({ err: err.message }, 'Error closing BullMQ workers/queues');
      }

      // 5. Close Primary Redis Client
      try {
        if (redis && redis.status === 'ready') {
          await redis.quit();
          logger.info('5. Primary Redis connection closed.');
        }
      } catch (err) {
        logger.warn({ err: err.message }, 'Error closing Redis client');
      }

      // 6. Disconnect Prisma Database Connection Pool
      try {
        if (prisma) {
          await prisma.$disconnect();
          logger.info('6. Prisma PostgreSQL connection pool disconnected.');
        }
      } catch (err) {
        logger.warn({ err: err.message }, 'Error disconnecting Prisma pool');
      }

      logger.info('✅ Graceful shutdown completed cleanly. Exiting process.');
      clearTimeout(forceExitTimer);
      process.exit(0);
    };

    process.on('uncaughtException', (err) => {
      logger.error({ err }, 'Uncaught exception detected in application process');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled promise rejection detected');
    });

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error({ err: error }, 'Failed to start EMS backend server');
    process.exit(1);
  }
}

startServer();
