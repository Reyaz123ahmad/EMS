import prisma from '../src/config/prisma.js';
import redis from '../src/config/redis.js';

export async function setupTestEnvironment() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_super_secure_key_12345';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_key_12345';
  return { prisma, redis };
}

export default setupTestEnvironment;
