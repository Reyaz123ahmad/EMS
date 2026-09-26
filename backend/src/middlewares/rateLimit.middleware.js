import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redis from '../config/redis.js';
import logger from '../config/logger.js';

/**
 * Helper to safely instantiate a RedisStore with automatic fallback
 */
const memStore = new Map();

const createSafeRedisStore = (prefix) => {
  if (redis) {
    try {
      return new RedisStore({
        sendCommand: async (...args) => {
          try {
            return await redis.call(...args);
          } catch (err) {
            logger.warn({ err: err.message, prefix }, 'Redis rate-limit error, falling back dynamically to memory');
            // Safe fallback return so express-rate-limit continues without 500 error
            const [cmd, key, ...rest] = args;
            const now = Date.now();
            const fullKey = `${prefix}${key || 'ip'}`;
            const entry = memStore.get(fullKey) || { count: 0, resetTime: now + 900000 };
            if (now > entry.resetTime) {
              entry.count = 0;
              entry.resetTime = now + 900000;
            }
            entry.count += 1;
            memStore.set(fullKey, entry);
            return [entry.count, entry.resetTime - now];
          }
        },
        prefix
      });
    } catch (err) {
      logger.warn({ err: err.message }, `Failed to initialize RedisStore for prefix ${prefix}`);
    }
  }
  return undefined;
};

/**
 * 1. Global API Rate Limiter
 * 300 requests per 15 minutes per IP across all instances
 */
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: createSafeRedisStore('rl:global:'),
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

/**
 * 2. Authentication Rate Limiter (Login, Register, Password Reset)
 * 20 requests per 15 minutes per IP across all instances
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: createSafeRedisStore('rl:auth:'),
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

/**
 * 3. OTP Rate Limiter
 * 10 requests per 10 minutes per IP across all instances
 */
export const otpRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: createSafeRedisStore('rl:otp:'),
  message: {
    status: 'error',
    message: 'Too many OTP requests. Please wait 10 minutes before requesting again.'
  }
});

// Aliases for compatibility with existing modules
export const globalRateLimiter = globalRateLimit;
export const authRateLimiter = authRateLimit;
export const otpRateLimiter = otpRateLimit;

export default {
  globalRateLimit,
  authRateLimit,
  otpRateLimit,
  globalRateLimiter,
  authRateLimiter,
  otpRateLimiter
};
