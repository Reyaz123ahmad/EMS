import { Worker } from 'bullmq';
import { connection } from '../config/bullmq.js';
import logger from '../config/logger.js';

export const smsWorker = new Worker(
  'sms-queue',
  async (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Processing SMS job');
    const { name, data } = job;

    switch (name) {
      case 'send-otp': {
        const { to, otp } = data;
        logger.info({ to, otp }, '[SMS Provider Demo] OTP Sent successfully');
        return { success: true, to, otp };
      }
      case 'send-alert': {
        const { to, message } = data;
        logger.info({ to, message }, '[SMS Provider Demo] Alert SMS Sent successfully');
        return { success: true, to, message };
      }
      default:
        throw new Error(`Unknown SMS job type: ${name}`);
    }
  },
  {
    connection,
    concurrency: 5
  }
);

smsWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, jobName: job.name }, 'SMS job completed');
});

smsWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'SMS job failed');
});

export default smsWorker;
