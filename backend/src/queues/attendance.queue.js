import { Queue } from 'bullmq';
import { defaultQueueOptions } from '../config/bullmq.js';

export const attendanceQueue = new Queue('attendance-queue', defaultQueueOptions);

export async function addDevicePunch({ deviceId, payload }) {
  return attendanceQueue.add('process-punch', { deviceId, payload });
}

export async function addAttendanceSync({ companyId }) {
  return attendanceQueue.add('sync-attendance', { companyId });
}

export default attendanceQueue;
