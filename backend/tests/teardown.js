import prisma from '../src/config/prisma.js';
import redis from '../src/config/redis.js';

export async function teardownTestEnvironment() {
  try {
    if (prisma?.$disconnect) {
      await prisma.$disconnect();
    }
    if (redis?.quit) {
      await redis.quit();
    }
  } catch (err) {
    // Ignore teardown disconnect errors
  }
}

export default teardownTestEnvironment;
