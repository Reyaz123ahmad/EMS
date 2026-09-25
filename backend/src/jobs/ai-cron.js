import { AIRateLimiterService } from '../services/ai-rate-limiter.service.js';
import logger from '../config/logger.js';

/**
 * Daily midnight maintenance cron for AI free tier counters
 */
export const resetDailyAILimit = async () => {
  logger.info('Executing midnight AI Free Tier quota reset...');
  try {
    await AIRateLimiterService.resetDailyLimit();
    logger.info('Daily AI rate limit quota reset completed successfully.');
  } catch (err) {
    logger.error({ err: err.message }, 'Failed during daily AI rate limit quota reset');
  }
};

export default {
  resetDailyAILimit
};
