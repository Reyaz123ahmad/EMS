import { Redis } from 'ioredis';
import env from './env.js';
import logger from './logger.js';

let redis = null;

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
  });
} else {
  logger.warn('REDIS_URL is not set. Redis client is disabled.');
}

export default redis;
