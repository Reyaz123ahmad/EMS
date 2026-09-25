import { Queue } from 'bullmq';
import { defaultQueueOptions } from '../config/bullmq.js';

export const payrollQueue = new Queue('payroll-queue', defaultQueueOptions);

export async function addPayrollRun({ companyId, month, year, processedBy }) {
  return payrollQueue.add('run-payroll', { companyId, month, year, processedBy });
}

export default payrollQueue;
