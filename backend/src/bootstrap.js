import env from './config/env.js';
import logger from './config/logger.js';
import redis from './config/redis.js';

export async function bootstrap() {
  logger.info('Bootstrapping application...');
  
  if (redis) {
    try {
      await redis.connect();
      logger.info('Connected to Upstash Redis');
    } catch (error) {
      logger.warn({ error: error.message }, 'Redis initial connection check failed, will retry on demand');
    }
  }

  logger.info(`Environment: ${env.NODE_ENV}`);
  return { env };
}

export default bootstrap;
