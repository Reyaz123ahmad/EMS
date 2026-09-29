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
    await attendanceQueue.add(
      'mark-absentees',
      {},
      {
        repeat: {
          every: 5 * 60 * 1000 // every 5 minutes
        },
        jobId: 'mark-absentees-cron'
      }
    );
  } catch (err) {
    // Ignore duplicate or scheduling warnings
  }
}

export default attendanceQueue;
