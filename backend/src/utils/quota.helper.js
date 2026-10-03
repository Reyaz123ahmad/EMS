/**
 * Universal Quota Validator & Helper
 *
 * Rules:
 * - limit of -1, null, undefined, or <= 0 indicates UNLIMITED.
 * - All quota checks must use this helper to prevent 8 >= -1 blocking bugs.
 */

/**
 * Check if a plan limit represents an unlimited quota
 * @param {number|string|null|undefined} limit
 * @returns {boolean}
 */
export function isUnlimited(limit) {
  if (limit === null || limit === undefined) return true;
  const num = Number(limit);
  if (isNaN(num)) return true;
  return num === -1 || num <= 0;
}

/**
 * Universal Quota Validator
 * @param {number} current - Current usage count
 * @param {number|null|undefined} limit - Plan limit (-1 or null for unlimited)
 * @returns {{ allowed: boolean, unlimited: boolean, current: number, limit: number, remaining: number }}
 */
export function checkQuota(current, limit) {
  const currentCount = Number(current) || 0;
  if (isUnlimited(limit)) {
    return {
      allowed: true,
      unlimited: true,
      current: currentCount,
      limit: -1,
      remaining: Infinity
    };
  }

  const numericLimit = Number(limit);
  return {
    allowed: currentCount < numericLimit,
    unlimited: false,
    current: currentCount,
    limit: numericLimit,
    remaining: Math.max(0, numericLimit - currentCount)
  };
}

export default {
  isUnlimited,
  checkQuota
};
