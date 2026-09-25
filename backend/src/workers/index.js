import { emailWorker } from './email.worker.js';
import { smsWorker } from './sms.worker.js';
import { pushWorker } from './push.worker.js';
import { payrollWorker } from './payroll.worker.js';
import { attendanceWorker } from './attendance.worker.js';
import { reportWorker } from './report.worker.js';
import { createAIWorker, closeAIWorker } from './ai.worker.js';
import logger from '../config/logger.js';

let activeAIWorker = null;

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
  logger.info(`Starting BullMQ background workers...`);
  allWorkers.forEach((w) => {
    if (w && typeof w.isPaused === 'function' && w.isPaused()) {
      w.resume();
    }
  });

  if (!activeAIWorker) {
    activeAIWorker = createAIWorker();
  }

  logger.info('All BullMQ workers (including AI Worker) active and listening for jobs.');
}

/**
 * Gracefully close all BullMQ workers
 */
export async function closeAllWorkers() {
  logger.info('Closing all BullMQ workers...');
  await Promise.all(allWorkers.map((w) => (w && typeof w.close === 'function' ? w.close() : Promise.resolve())));
  if (activeAIWorker) {
    await closeAIWorker();
    activeAIWorker = null;
  }
  logger.info('All BullMQ workers closed successfully.');
}

export {
  emailWorker,
  smsWorker,
  pushWorker,
  payrollWorker,
  attendanceWorker,
  reportWorker,
  activeAIWorker as aiWorker
};

export default {
  allWorkers,
  startAllWorkers,
  closeAllWorkers
};
