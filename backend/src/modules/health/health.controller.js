import * as healthService from './health.service.js';

export async function getHealth(req, res) {
  const health = await healthService.getOverallHealth();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}

export async function getDbHealth(req, res) {
  const db = await healthService.checkDatabase();
  res.status(db.status === 'healthy' ? 200 : 500).json(db);
}

export async function getRedisHealth(req, res) {
  const red = await healthService.checkRedis();
  res.status(red.status === 'healthy' ? 200 : 500).json(red);
}

export async function getQueuesHealth(req, res) {
  const queues = await healthService.checkQueues();
  res.status(200).json(queues);
}

export async function getStorageHealth(req, res) {
  const storage = await healthService.checkStorage();
  res.status(200).json(storage);
}

export async function getEmailHealth(req, res) {
  const email = await healthService.checkEmail();
  res.status(200).json(email);
}

export default {
  getHealth,
  getDbHealth,
  getRedisHealth,
  getQueuesHealth,
  getStorageHealth,
  getEmailHealth,
};
