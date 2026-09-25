import { addOTPEmail } from './queues/email.queue.js';
import env from './config/env.js';
import logger from './config/logger.js';

async function testQueueFlow() {
  logger.info(`Adding test OTP email job to BullMQ 'email-queue' for ${env.SUPER_ADMIN_EMAIL}...`);

  const job = await addOTPEmail({
    to: env.SUPER_ADMIN_EMAIL,
    name: 'Reyaz Ahmad (Super Admin)',
    otp: '458921',
    purpose: 'BullMQ Queue Pipeline Live Test',
    expiryMinutes: 10
  });

  logger.info({ jobId: job.id, queueName: job.queueName }, 'Job successfully enqueued in BullMQ');
  
  // Wait a few seconds for the worker to pick up and process the job
  logger.info('Waiting 6 seconds for worker to process job...');
  await new Promise((resolve) => setTimeout(resolve, 6000));

  const state = await job.getState();
  logger.info({ jobId: job.id, finalState: state }, 'Job lifecycle state check');
  process.exit(0);
}

testQueueFlow().catch((err) => {
  logger.error({ err }, 'Error in queue test flow');
  process.exit(1);
});
