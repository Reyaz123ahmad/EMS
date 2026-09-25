import { startAllWorkers, closeAllWorkers } from './index.js';
import logger from '../config/logger.js';
import { bootstrap } from '../bootstrap.js';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';

async function run() {
  await bootstrap();
  const workerId = process.env.WORKER_ID || 'standalone-worker';
  logger.info({ workerId }, `🚀 Starting standalone BullMQ Worker Process (${workerId})...`);
  startAllWorkers();

  if (process.send) {
    process.send('ready');
    logger.info(`Worker ${workerId} sent ready signal to PM2`);
  }

  const shutdown = async (signal) => {
    logger.info({ signal, workerId }, `Received ${signal}. Gracefully stopping all BullMQ workers...`);
    try {
      await closeAllWorkers();
      if (redis && redis.status === 'ready') {
        await redis.quit();
      }
      if (prisma) {
        await prisma.$disconnect();
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Error stopping workers');
    }
    logger.info(`Worker ${workerId} stopped cleanly.`);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

run().catch((err) => {
  logger.error({ err }, 'Worker process encountered fatal error');
  process.exit(1);
});
