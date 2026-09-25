import redis from '../config/redis.js';
import logger from '../config/logger.js';

/**
 * Cache middleware with TTL support and auto-invalidation
 * @param {string} prefix - Key prefix (e.g. 'cache:plans', 'cache:company:settings')
 * @param {number} ttlSeconds - Time-to-live in seconds
 */
export function cacheResponse(prefix, ttlSeconds = 300) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const companyId = req.user?.companyId || 'global';
      const cacheKey = `${prefix}:${companyId}:${req.originalUrl}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', `public, max-age=${ttlSeconds}`);
        return res.status(200).json(JSON.parse(cached));
      }

      // Intercept res.json
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setex(cacheKey, ttlSeconds, JSON.stringify(body)).catch((err) => {
            logger.warn({ err: err.message }, 'Failed to set redis cache');
          });
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
    const pattern = companyId ? `${prefix}:${companyId}:*` : `${prefix}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info({ prefix, count: keys.length }, 'Cache invalidated');
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to invalidate cache');
  }
}

export default {
  cacheResponse,
  invalidateCache,
};
