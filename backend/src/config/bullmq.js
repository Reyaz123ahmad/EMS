import { Queue, Worker, QueueEvents } from 'bullmq';
import env from './env.js';

/**
 * BullMQ Redis Connection options parsed from REDIS_URL
 */
function parseRedisUrl(urlStr) {
  if (!urlStr) {
    return {
      host: '127.0.0.1',
      port: 6379
    };
  }

  try {
    const url = new URL(urlStr);
    const isTls = url.protocol === 'rediss:';
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      username: url.username || undefined,
      password: url.password || undefined,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    };
  } catch {
    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null
    };
  }
}

export const connection = parseRedisUrl(env.REDIS_URL);

export const defaultQueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: {
      age: 3600, // 1 hour
      count: 100
    },
    removeOnFail: {
      age: 86400, // 24 hours
      count: 500
    }
  }
};

export { Queue, Worker, QueueEvents };
export default { connection, defaultQueueOptions };
