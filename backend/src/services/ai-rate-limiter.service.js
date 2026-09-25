import redis from '../config/redis.js';
import logger from '../config/logger.js';
import { RATE_LIMITS } from '../config/ai.js';

// In-memory fallback counters when Redis is disabled/unavailable
const memoryCounter = {
  minuteWindow: 0,
  minuteCount: 0,
  dayWindow: '',
  dayCount: 0
};

export class AIRateLimiterService {
  static getMinuteKey(timestamp = Date.now()) {
    const minute = Math.floor(timestamp / 60000);
    return `ai:ratelimit:min:${minute}`;
  }

  static getDayKey(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    return `ai:ratelimit:day:${dateStr}`;
  }

  /**
   * Check if request is allowed within Free Tier limits (15/min, 1500/day)
   * and increment counters atomically.
   */
  static async checkAndIncrement() {
    const now = Date.now();
    const minuteKey = this.getMinuteKey(now);
    const dayKey = this.getDayKey(new Date(now));

    const maxPerMinute = RATE_LIMITS.requestsPerMinute;
    const maxPerDay = RATE_LIMITS.requestsPerDay;

    if (redis && redis.status === 'ready') {
      try {
        const pipeline = redis.pipeline();
        pipeline.incr(minuteKey);
        pipeline.expire(minuteKey, 65); // Expire after 65 seconds
        pipeline.incr(dayKey);
        pipeline.expire(dayKey, 86400 * 2); // Expire after 2 days

        const results = await pipeline.exec();
        const minCount = results[0][1];
        const dayCount = results[2][1];

        const allowed = minCount <= maxPerMinute && dayCount <= maxPerDay;
        const retryAfterSeconds = minCount > maxPerMinute ? (60 - Math.floor((now % 60000) / 1000)) : (minCount > maxPerMinute ? 60 : 0);

        return {
          allowed,
          minCount,
          dayCount,
          remainingMinute: Math.max(0, maxPerMinute - minCount),
          remainingDay: Math.max(0, maxPerDay - dayCount),
          maxPerMinute,
          maxPerDay,
          retryAfterSeconds,
          resetAt: new Date(now + retryAfterSeconds * 1000)
        };
      } catch (err) {
        logger.warn({ err: err.message }, 'Redis error in AI rate limiter, using in-memory fallback');
      }
    }

    // In-memory fallback
    const currentMinWindow = Math.floor(now / 60000);
    const currentDayWindow = new Date(now).toISOString().split('T')[0];

    if (memoryCounter.minuteWindow !== currentMinWindow) {
      memoryCounter.minuteWindow = currentMinWindow;
      memoryCounter.minuteCount = 0;
    }
    if (memoryCounter.dayWindow !== currentDayWindow) {
      memoryCounter.dayWindow = currentDayWindow;
      memoryCounter.dayCount = 0;
    }

    memoryCounter.minuteCount += 1;
    memoryCounter.dayCount += 1;

    const allowed = memoryCounter.minuteCount <= maxPerMinute && memoryCounter.dayCount <= maxPerDay;
    const retryAfterSeconds = memoryCounter.minuteCount > maxPerMinute ? 60 : 0;

    return {
      allowed,
      minCount: memoryCounter.minuteCount,
      dayCount: memoryCounter.dayCount,
      remainingMinute: Math.max(0, maxPerMinute - memoryCounter.minuteCount),
      remainingDay: Math.max(0, maxPerDay - memoryCounter.dayCount),
      maxPerMinute,
      maxPerDay,
      retryAfterSeconds,
      resetAt: new Date(now + retryAfterSeconds * 1000)
    };
  }

  /**
   * Get current usage statistics without incrementing
   */
  static async getRateLimitStatus() {
    const now = Date.now();
    const minuteKey = this.getMinuteKey(now);
    const dayKey = this.getDayKey(new Date(now));

    let minCount = 0;
    let dayCount = 0;

    if (redis && redis.status === 'ready') {
      try {
        const [minVal, dayVal] = await Promise.all([redis.get(minuteKey), redis.get(dayKey)]);
        minCount = parseInt(minVal || '0', 10);
        dayCount = parseInt(dayVal || '0', 10);
      } catch (err) {
        logger.warn({ err: err.message }, 'Redis get error in AI rate limiter');
      }
    } else {
      minCount = memoryCounter.minuteCount;
      dayCount = memoryCounter.dayCount;
    }

    const maxPerMinute = RATE_LIMITS.requestsPerMinute;
    const maxPerDay = RATE_LIMITS.requestsPerDay;

    return {
      minCount,
      dayCount,
      remainingMinute: Math.max(0, maxPerMinute - minCount),
      remainingDay: Math.max(0, maxPerDay - dayCount),
      maxPerMinute,
      maxPerDay,
      tier: 'FREE (Google Gemini 1.5 Flash)'
    };
  }

  /**
   * Reset daily counter (e.g., at midnight)
   */
  static async resetDailyLimit() {
    const dayKey = this.getDayKey(new Date());
    if (redis && redis.status === 'ready') {
      try {
        await redis.del(dayKey);
        logger.info('Daily AI rate limit counter reset in Redis');
      } catch (err) {
        logger.warn({ err: err.message }, 'Failed to reset daily AI rate limit counter in Redis');
      }
    }
    memoryCounter.dayCount = 0;
  }
}

export default AIRateLimiterService;
