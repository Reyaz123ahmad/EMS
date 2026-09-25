import { startAllWorkers, closeAllWorkers } from './index.js';
import logger from '../config/logger.js';
import { bootstrap } from '../bootstrap.js';

async function run() {
  await bootstrap();
  logger.info('🚀 Starting standalone BullMQ Worker Process...');
  startAllWorkers();

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Gracefully stopping all BullMQ workers...`);
    await closeAllWorkers();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

run().catch((err) => {
  logger.error({ err }, 'Worker process encountered fatal error');
  process.exit(1);
});
