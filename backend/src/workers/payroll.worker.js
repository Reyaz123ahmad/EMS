import { Worker } from 'bullmq';
import { connection } from '../config/bullmq.js';
import logger from '../config/logger.js';

export const payrollWorker = new Worker(
  'payroll-queue',
  async (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Processing Payroll Calculation job');
    const { companyId, month, year, processedBy } = job.data;

    logger.info({ companyId, month, year, processedBy }, 'Executing batch payroll calculation');
    return { success: true, companyId, month, year, processedAt: new Date().toISOString() };
  },
  {
    connection,
    concurrency: 2
  }
);

payrollWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Payroll job completed');
});

payrollWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Payroll job failed');
});

export default payrollWorker;
