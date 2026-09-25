import http from 'http';
import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import redis from './config/redis.js';
import { bootstrap } from './bootstrap.js';
import { initSocket } from './config/socket.js';
import { startAllWorkers, closeAllWorkers } from './workers/index.js';
import { closeAllQueues } from './queues/index.js';

let server;
let httpServer;

async function startServer() {
  try {
    await bootstrap();

    // In development mode, run BullMQ workers in the same process
    if (env.NODE_ENV !== 'production') {
      logger.info('Development mode detected: starting in-process BullMQ workers...');
      startAllWorkers();
    }

    const PORT = env.PORT || 5000;
    httpServer = http.createServer(app);
    initSocket(httpServer);

    server = httpServer.listen(PORT, () => {
      logger.info(`EMS Backend server running on port ${PORT}`);
      logger.info(`Socket.io initialized and attached to HTTP server`);
      logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
      logger.info(`Queue Monitor API: http://localhost:${PORT}/api/v1/admin/queues/stats`);
      logger.info(`Bull Board Dashboard: http://localhost:${PORT}/admin/queues-dashboard`);
    });

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed.');

          try {
            await closeAllWorkers();
            await closeAllQueues();
            if (redis && redis.status === 'ready') {
              await redis.quit();
              logger.info('Redis connection closed.');
            }
          } catch (err) {
            logger.error({ err }, 'Error during resource teardown');
          }

          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on('uncaughtException', (err) => {
      logger.error({ err }, 'Uncaught exception detected in background');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled promise rejection detected in background');
    });

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
