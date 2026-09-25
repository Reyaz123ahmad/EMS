import { queueMonitorService } from './queue-monitor.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const queueMonitorController = {
  async getStats(req, res) {
    try {
      const stats = await queueMonitorService.getQueueStats();
      return sendSuccess(res, stats, 'Queue stats retrieved successfully');
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  async getHealth(req, res) {
    try {
      const health = await queueMonitorService.getQueueHealth();
      return sendSuccess(res, health, 'Queue health retrieved');
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  },

  async getJobs(req, res) {
    try {
      const { queue: queueName } = req.params;
      const { status = 'all', page = 1, limit = 20 } = req.query;
      const jobs = await queueMonitorService.getQueueJobs(queueName, status, { page, limit });
      return sendSuccess(res, jobs, 'Queue jobs retrieved');
    } catch (err) {
      const statusCode = err.message.includes('not found') ? 404 : 500;
      return sendError(res, err.message, statusCode);
    }
  },

  async retryJob(req, res) {
    try {
      const { queue: queueName, jobId } = req.params;
      const result = await queueMonitorService.retryJob(queueName, jobId);
      return sendSuccess(res, result, 'Job retry initiated');
    } catch (err) {
      const statusCode = err.message.includes('not found') ? 404 : 500;
      return sendError(res, err.message, statusCode);
    }
  },

  async removeJob(req, res) {
    try {
      const { queue: queueName, jobId } = req.params;
      const result = await queueMonitorService.removeJob(queueName, jobId);
      return sendSuccess(res, result, 'Job removed successfully');
    } catch (err) {
      const statusCode = err.message.includes('not found') ? 404 : 500;
      return sendError(res, err.message, statusCode);
    }
  },

  async pauseQueue(req, res) {
    try {
      const { queue: queueName } = req.params;
      const result = await queueMonitorService.pauseQueue(queueName);
      return sendSuccess(res, result, `Queue ${queueName} paused`);
    } catch (err) {
      const statusCode = err.message.includes('not found') ? 404 : 500;
      return sendError(res, err.message, statusCode);
    }
  },

  async resumeQueue(req, res) {
    try {
      const { queue: queueName } = req.params;
      const result = await queueMonitorService.resumeQueue(queueName);
      return sendSuccess(res, result, `Queue ${queueName} resumed`);
    } catch (err) {
      const statusCode = err.message.includes('not found') ? 404 : 500;
      return sendError(res, err.message, statusCode);
    }
  },

  async cleanQueue(req, res) {
    try {
      const { queue: queueName } = req.params;
      const { gracePeriod, status, limit } = req.body;
      const result = await queueMonitorService.cleanQueue(queueName, gracePeriod, status, limit);
      return sendSuccess(res, result, `Queue ${queueName} cleaned`);
    } catch (err) {
      const statusCode = err.message.includes('not found') ? 404 : 500;
      return sendError(res, err.message, statusCode);
    }
  },
};
