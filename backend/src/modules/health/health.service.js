import prisma from '../../config/prisma.js';
import redis from '../../config/redis.js';
import { allQueues } from '../../queues/index.js';
import { v2 as cloudinary } from 'cloudinary';
import nodemailer from 'nodemailer';
import env from '../../config/env.js';

export async function checkDatabase() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    return { status: 'healthy', latencyMs: duration, provider: 'PostgreSQL' };
  } catch (err) {
    return { status: 'unhealthy', error: err.message, latencyMs: Date.now() - start };
  }
}

export async function checkRedis() {
  const start = Date.now();
  try {
    const ping = await redis.ping();
    const duration = Date.now() - start;
    return { status: ping === 'PONG' ? 'healthy' : 'degraded', latencyMs: duration };
  } catch (err) {
    return { status: 'unhealthy', error: err.message, latencyMs: Date.now() - start };
  }
}

export async function checkQueues() {
  try {
    const queueStatuses = await Promise.all(
      allQueues.map(async (q) => {
        const counts = await q.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting');
        return {
          name: q.name,
          active: counts.active || 0,
          waiting: counts.waiting || 0,
          failed: counts.failed || 0,
          completed: counts.completed || 0,
        };
      })
    );
    return { status: 'healthy', queues: queueStatuses };
  } catch (err) {
    return { status: 'degraded', error: err.message };
  }
}

export async function checkStorage() {
  try {
    const isConfigured = !!(env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME);
    return {
      status: isConfigured ? 'healthy' : 'mocked',
      provider: 'Cloudinary',
      cloudName: env.CLOUDINARY_CLOUD_NAME || 'configured',
    };
  } catch (err) {
    return { status: 'degraded', error: err.message };
  }
}

export async function checkEmail() {
  try {
    const isConfigured = !!(env.SMTP_HOST || process.env.SMTP_HOST || env.RESEND_API_KEY);
    return {
      status: isConfigured ? 'healthy' : 'simulated',
      provider: env.SMTP_HOST ? 'SMTP' : 'Direct/Simulated',
    };
  } catch (err) {
    return { status: 'degraded', error: err.message };
  }
}

export async function getOverallHealth() {
  const [db, red, queues, storage, email] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkQueues(),
    checkStorage(),
    checkEmail(),
  ]);

  const isHealthy = db.status === 'healthy';

  return {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    system: {
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    },
    services: {
      database: db,
      redis: red,
      queues,
      storage,
      email,
    },
  };
}

export default {
  checkDatabase,
  checkRedis,
  checkQueues,
  checkStorage,
  checkEmail,
  getOverallHealth,
};
