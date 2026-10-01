import { Queue } from 'bullmq';
import { defaultQueueOptions } from '../config/bullmq.js';
import logger from '../config/logger.js';

export const attendanceQueue = new Queue('attendance-queue', defaultQueueOptions);

export async function addDevicePunch({ deviceId, payload }) {
  return attendanceQueue.add('process-punch', { deviceId, payload });
}

export async function addAttendanceSync({ companyId }) {
  return attendanceQueue.add('sync-attendance', { companyId });
}

export async function addMarkAbsenteesJob({ companyId, forceAllShifts } = {}) {
  return attendanceQueue.add('mark-absentees', { companyId, forceAllShifts });
}

let fallbackInterval = null;

export async function scheduleAutoAbsentCron() {
  try {
    const repeatableJobs = await attendanceQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await attendanceQueue.removeRepeatableByKey(job.key);
    }

    await attendanceQueue.add(
      'mark-absentees',
      {},
      {
        repeat: {
          every: 5 * 60 * 1000 // every 5 minutes
        },
        jobId: 'mark-absentees-cron',
        removeOnComplete: true,
        removeOnFail: true
      }
    );
    logger.info('Auto-absent evaluation cron registered in BullMQ (every 5 minutes)');
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to schedule BullMQ auto-absent cron, activating in-process interval fallback');
    if (!fallbackInterval) {
      fallbackInterval = setInterval(async () => {
        try {
          const { markAbsenteesAllCompanies } = await import('../modules/attendance/services/markAbsentees.service.js');
          await markAbsenteesAllCompanies();
        } catch (intervalErr) {
          logger.error({ err: intervalErr.message }, 'In-process auto-absent fallback run failed');
        }
      }, 5 * 60 * 1000);
      fallbackInterval.unref();
    }
  }
}

export default attendanceQueue;
