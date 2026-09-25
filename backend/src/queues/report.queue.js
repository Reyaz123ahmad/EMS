import { Queue } from 'bullmq';
import { defaultQueueOptions } from '../config/bullmq.js';

export const reportQueue = new Queue('report-queue', defaultQueueOptions);

export async function addReportGeneration({ companyId, type, filters, userId }) {
  return reportQueue.add('generate-report', { companyId, type, filters, userId });
}

export default reportQueue;
