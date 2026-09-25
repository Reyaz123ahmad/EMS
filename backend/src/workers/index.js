import { emailWorker } from './email.worker.js';
import { smsWorker } from './sms.worker.js';
import { pushWorker } from './push.worker.js';
import { payrollWorker } from './payroll.worker.js';
import { attendanceWorker } from './attendance.worker.js';
import { reportWorker } from './report.worker.js';
import logger from '../config/logger.js';

export const allWorkers = [
  emailWorker,
  smsWorker,
  pushWorker,
  payrollWorker,
  attendanceWorker,
  reportWorker
];

/**
 * Start/Resume all workers
 */
export function startAllWorkers() {
  logger.info(`Starting ${allWorkers.length} BullMQ background workers...`);
  allWorkers.forEach((w) => {
    if (w.isPaused()) {
      w.resume();
    }
  });
  logger.info('All BullMQ workers active and listening for jobs.');
}

/**
 * Gracefully close all BullMQ workers
 */
export async function closeAllWorkers() {
  logger.info('Closing all BullMQ workers...');
  await Promise.all(allWorkers.map((w) => w.close()));
  logger.info('All BullMQ workers closed successfully.');
}

export {
  emailWorker,
  smsWorker,
  pushWorker,
  payrollWorker,
  attendanceWorker,
  reportWorker
};

export default {
  allWorkers,
  startAllWorkers,
  closeAllWorkers
};
