import { Queue } from 'bullmq';
import { defaultQueueOptions } from '../config/bullmq.js';

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

export async function scheduleAutoAbsentCron() {
  try {
    const repeatableJobs = await attendanceQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await attendanceQueue.removeRepeatableByKey(job.key);
    }

    if (process.env.NODE_ENV === 'production') {
      await attendanceQueue.add(
        'mark-absentees',
        {},
        {
          repeat: {
            every: 60 * 60 * 1000 // every 60 minutes in production
          },
          jobId: 'mark-absentees-cron',
          removeOnComplete: true,
          removeOnFail: true
        }
      );
    }
  } catch (err) {
    // Ignore scheduling errors
  }
}

export default attendanceQueue;
