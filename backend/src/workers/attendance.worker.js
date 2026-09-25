import { Worker } from 'bullmq';
import { connection } from '../config/bullmq.js';
import logger from '../config/logger.js';
import { devicePunchesService } from '../modules/device-punches/device-punches.service.js';

export const attendanceWorker = new Worker(
  'attendance-queue',
  async (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Processing Attendance queue job');
    const { name, data } = job;

    switch (name) {
      case 'process-punch':
      case 'process-finger-punch': {
        const { punchId, deviceId } = data;
        logger.info({ punchId, deviceId }, 'Processing device punch job');
        if (punchId) {
          const result = await devicePunchesService.processPunch(punchId);
          return { success: true, punch: result };
        }
        return { success: true, deviceId };
      }
      case 'sync-attendance':
      case 'sync-finger-templates': {
        const { companyId, deviceId } = data;
        logger.info({ companyId, deviceId }, 'Attendance / Finger templates synced');
        return { success: true, companyId, deviceId };
      }
      default:
        throw new Error(`Unknown attendance job: ${name}`);
    }

  },
  {
    connection,
    concurrency: 10
  }
);

attendanceWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Attendance job completed');
});

attendanceWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Attendance job failed');
});

export default attendanceWorker;
