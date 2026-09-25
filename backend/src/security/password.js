import bcrypt from 'bcryptjs';
import env from '../config/env.js';

/**
 * Hash a plain text password
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password with hashed password
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
