import { Worker } from 'bullmq';
import { connection } from '../config/bullmq.js';
import logger from '../config/logger.js';
import reportsService from '../modules/reports/reports.service.js';
import prisma from '../config/prisma.js';

export const reportWorker = new Worker(
  'report-queue',
  async (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Processing Report generation job');
    const { companyId, type, filters, userId, format } = job.data;

    try {
      const result = await reportsService.exportReport({
        type: type || 'ATTENDANCE',
        filters: filters || {},
        format: format || 'CSV',
        companyId,
        userId
      });

      if (userId) {
        await prisma.notification.create({
          data: {
            userId,
            companyId,
            type: 'REPORT_READY',
            title: 'Your Report is Ready for Download',
            message: `The ${type} report you requested has been generated successfully.`,
            data: {
              fileUrl: result.fileUrl,
              fileName: result.fileName
            }
          }
        }).catch((err) => logger.warn({ err: err.message }, 'Could not create report notification'));
      }

      logger.info({ jobId: job.id, fileUrl: result.fileUrl }, 'Report job processed successfully');
      return { success: true, ...result };
    } catch (err) {
      logger.error({ jobId: job.id, err: err.message }, 'Failed processing report job');
      throw err;
    }
  },
  {
    connection,
    concurrency: 3
  }
);

reportWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Report job completed');
});

reportWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Report job failed');
});

export default reportWorker;
