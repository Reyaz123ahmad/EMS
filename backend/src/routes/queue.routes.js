import { Router } from 'express';
import {
  emailQueue,
  smsQueue,
  pushQueue,
  payrollQueue,
  attendanceQueue,
  reportQueue,
  allQueues
} from '../queues/index.js';

const router = Router();

const queueMap = {
  'email-queue': emailQueue,
  'sms-queue': smsQueue,
  'push-queue': pushQueue,
  'payroll-queue': payrollQueue,
  'attendance-queue': attendanceQueue,
  'report-queue': reportQueue
};

// GET /api/v1/admin/queues/stats
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Promise.all(
      allQueues.map(async (queue) => {
        const counts = await queue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
          'paused'
        );
        return {
          name: queue.name,
          ...counts
        };
      })
    );

    res.status(200).json({ status: 'ok', data: stats });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/queues/:queue/jobs
router.get('/:queue/jobs', async (req, res, next) => {
  try {
    const { queue: queueName } = req.params;
    const { status = 'all', page = 1, limit = 20 } = req.query;

    const queue = queueMap[queueName];
    if (!queue) {
      return res.status(404).json({ status: 'error', message: `Queue ${queueName} not found` });
    }

    const statuses =
      status === 'all'
        ? ['waiting', 'active', 'completed', 'failed', 'delayed']
        : [status];

    const start = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const end = start + parseInt(limit, 10) - 1;

    const jobs = await queue.getJobs(statuses, start, end, true);

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      opts: job.opts,
      progress: job.progress,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      state: job.getState ? 'active' : 'unknown'
    }));

    res.status(200).json({
      status: 'ok',
      data: {
        queue: queueName,
        total: formattedJobs.length,
        jobs: formattedJobs
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/queues/:queue/:jobId/retry
router.post('/:queue/:jobId/retry', async (req, res, next) => {
  try {
    const { queue: queueName, jobId } = req.params;
    const queue = queueMap[queueName];
    if (!queue) {
      return res.status(404).json({ status: 'error', message: `Queue ${queueName} not found` });
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ status: 'error', message: `Job ${jobId} not found` });
    }

    await job.retry();
    res.status(200).json({ status: 'ok', message: `Job ${jobId} retried successfully` });
  } catch (error) {
    next(error);
  }
});

export default router;
