import redis from '../config/redis.js';
import logger from '../config/logger.js';

// Ultra-fast In-Memory LRU-style cache
const memoryCache = new Map();
const MAX_MEMORY_KEYS = 10000;

function getFromMemory(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

function setToMemory(key, value, ttlSeconds) {
  if (memoryCache.size >= MAX_MEMORY_KEYS) {
    // Evict first (oldest) key
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });
}

function timeoutPromise(ms, promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), ms))
  ]);
}

/**
 * Cache middleware with In-Memory + Redis fallback & 150ms max latency guard
 * @param {string} prefix - Key prefix (e.g. 'cache:plans', 'cache:company:settings')
 * @param {number} ttlSeconds - Time-to-live in seconds
 */
export function cacheResponse(prefix, ttlSeconds = 86400) {
  const effectiveTtl = Math.max(ttlSeconds, 86400);
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const companyId = req.user?.companyId || 'global';
    const userId = req.user?.id || 'anon';
    const cacheKey = `${prefix}:${companyId}:${userId}:${req.originalUrl}`;

    try {
      // 1. Instant check in memory (<0.1ms)
      const memCached = getFromMemory(cacheKey);
      if (memCached) {
        res.set('X-Cache', 'HIT-MEMORY');
        res.set('Cache-Control', `public, max-age=${effectiveTtl}`);
        const statusCode = memCached.status || 200;
        const responseData = memCached.body !== undefined ? memCached.body : memCached;
        return res.status(statusCode).json(responseData);
      }

      // 2. Check Redis with 150ms timeout guard
      if (redis && redis.status === 'ready') {
        try {
          const redisCached = await timeoutPromise(150, redis.get(cacheKey));
          if (redisCached) {
            const parsed = JSON.parse(redisCached);
            setToMemory(cacheKey, parsed, effectiveTtl);
            res.set('X-Cache', 'HIT-REDIS');
            res.set('Cache-Control', `public, max-age=${effectiveTtl}`);
            const statusCode = parsed.status || 200;
            const responseData = parsed.body !== undefined ? parsed.body : parsed;
            return res.status(statusCode).json(responseData);
          }
        } catch (rErr) {
          // Silent fallback to avoid slowing down API response
        }
      }

      // 3. Intercept response to cache on success & client responses (<500)
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode < 500) {
          const cachePayload = { status: res.statusCode, body };
          setToMemory(cacheKey, cachePayload, effectiveTtl);
          if (redis && redis.status === 'ready') {
            redis.setex(cacheKey, effectiveTtl, JSON.stringify(cachePayload)).catch(() => {});
          }
        }
        res.set('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (err) {
      next();
    }
  };
}

/**
 * Invalidate cached keys matching a prefix
 */
export async function invalidateCache(prefix, companyId = null) {
  try {
    const keyPrefix = companyId ? `${prefix}:${companyId}` : prefix;
    
    // Clear in-memory keys
    for (const key of memoryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        memoryCache.delete(key);
      }
    }

    // Clear Redis keys asynchronously with timeout
    if (redis && redis.status === 'ready') {
      const pattern = `${keyPrefix}:*`;
      timeoutPromise(300, redis.keys(pattern)).then(async (keys) => {
        if (keys && keys.length > 0) {
          await redis.del(...keys);
        }
      }).catch(() => {});
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to invalidate cache');
  }
}

export default {
  cacheResponse,
  invalidateCache,
};
