import { Queue } from 'bullmq';
import { connection } from '../config/bullmq.js';
import logger from '../config/logger.js';

export const aiQueue = new Queue('ai-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

aiQueue.on('error', (err) => {
  logger.error({ err: err.message }, 'BullMQ AI Queue Connection Error');
});

export const addEmployeeInsightJob = async ({ employeeId, companyId, period }) => {
  return await aiQueue.add('employee-insight', { employeeId, companyId, period }, { priority: 2 });
};

export const addCompanyAnalyticsJob = async ({ companyId, period }) => {
  return await aiQueue.add('company-analytics', { companyId, period }, { priority: 3 });
};

export const addPlatformAnalyticsJob = async ({ period }) => {
  return await aiQueue.add('platform-analytics', { period }, { priority: 3 });
};

export const addAttritionPredictionJob = async ({ employeeId, companyId }) => {
  return await aiQueue.add('attrition-prediction', { employeeId, companyId }, { priority: 2 });
};

export const addAnomalyDetectionJob = async ({ companyId, dataType }) => {
  return await aiQueue.add('anomaly-detection', { companyId, dataType }, { priority: 1 });
};

export default {
  aiQueue,
  addEmployeeInsightJob,
  addCompanyAnalyticsJob,
  addPlatformAnalyticsJob,
  addAttritionPredictionJob,
  addAnomalyDetectionJob
};
