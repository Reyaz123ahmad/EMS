import { Worker } from 'bullmq';
import { connection } from '../config/bullmq.js';
import logger from '../config/logger.js';

export const pushWorker = new Worker(
  'push-queue',
  async (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Processing Push Notification job');
    const { userId, title, body, data } = job.data;

    logger.info({ userId, title, body }, '[Push Provider Demo] Notification dispatched');
    return { success: true, userId, title };
  },
  {
    connection,
    concurrency: 5
  }
);

pushWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Push job completed');
});

pushWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Push job failed');
});

export default pushWorker;
