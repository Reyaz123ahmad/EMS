import { Worker } from 'bullmq';
import { connection } from '../config/bullmq.js';
import logger from '../config/logger.js';
import AIService from '../services/ai.service.js';

let aiWorkerInstance = null;

export const createAIWorker = () => {
  aiWorkerInstance = new Worker(
    'ai-queue',
    async (job) => {
      logger.info({ jobId: job.id, jobName: job.name }, 'Processing asynchronous AI inference job...');

      switch (job.name) {
        case 'employee-insight': {
          const { employeeId, companyId, period } = job.data;
          return await AIService.generateEmployeePerformanceInsight(employeeId, companyId, period);
        }

        case 'company-analytics': {
          const { companyId, period } = job.data;
          return await AIService.generateCompanyAnalytics(companyId, period);
        }

        case 'platform-analytics': {
          const { period } = job.data;
          return await AIService.generatePlatformAnalytics(period);
        }

        case 'attrition-prediction': {
          const { employeeId, companyId } = job.data;
          return await AIService.generateAttritionPrediction(employeeId, companyId);
        }

        case 'anomaly-detection': {
          const { companyId, dataType } = job.data;
          return await AIService.generateAnomalyDetection(companyId, dataType);
        }

        default:
          throw new Error(`Unknown AI job name: ${job.name}`);
      }
    },
    {
      connection,
      concurrency: 1, // Strict concurrency 1 to honor Gemini Free Tier constraints
      limiter: {
        max: 15,
        duration: 60000 // 15 jobs per 60s
      }
    }
  );

  aiWorkerInstance.on('completed', (job, returnvalue) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'AI Worker Job completed successfully');
  });

  aiWorkerInstance.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, jobName: job?.name, err: err.message }, 'AI Worker Job failed');
  });

  return aiWorkerInstance;
};

export const closeAIWorker = async () => {
  if (aiWorkerInstance) {
    await aiWorkerInstance.close();
    logger.info('AI Worker closed gracefully');
  }
};

export default {
  createAIWorker,
  closeAIWorker
};
