import { emailQueue } from './email.queue.js';
import { smsQueue } from './sms.queue.js';
import { pushQueue } from './push.queue.js';
import { payrollQueue } from './payroll.queue.js';
import { attendanceQueue } from './attendance.queue.js';
import { reportQueue } from './report.queue.js';
import logger from '../config/logger.js';

export const allQueues = [
  emailQueue,
  smsQueue,
  pushQueue,
  payrollQueue,
  attendanceQueue,
  reportQueue
];

/**
 * Gracefully close all BullMQ queues
 */
export async function closeAllQueues() {
  logger.info('Closing all BullMQ queues...');
  await Promise.all(allQueues.map((q) => q.close()));
  logger.info('All BullMQ queues closed successfully');
}

export {
  emailQueue,
  smsQueue,
  pushQueue,
  payrollQueue,
  attendanceQueue,
  reportQueue
};

export default {
  emailQueue,
  smsQueue,
  pushQueue,
  payrollQueue,
  attendanceQueue,
  reportQueue,
  allQueues,
  closeAllQueues
};
