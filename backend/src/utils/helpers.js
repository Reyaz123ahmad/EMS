import crypto from 'crypto';
import dayjs from 'dayjs';

/**
 * Generate a random cryptographic string
 * @param {number} length 
 * @returns {string}
 */
export function generateRandomString(length = 32) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Generate a standard API Key
 * @param {string} prefix 
 * @returns {string}
 */
export function generateApiKey(prefix = 'ems_key_') {
  return `${prefix}${crypto.randomUUID().replace(/-/g, '')}`;
}

/**
 * Format date using dayjs
 * @param {Date|string|number} date 
 * @param {string} format 
 * @returns {string}
 */
export function formatDate(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
  return dayjs(date).format(format);
}
