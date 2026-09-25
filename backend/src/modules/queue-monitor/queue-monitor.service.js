import {
  allQueues,
  emailQueue,
  smsQueue,
  pushQueue,
  payrollQueue,
  attendanceQueue,
  reportQueue,
} from '../../queues/index.js';

const queueMap = {
  'email-queue': emailQueue,
  'sms-queue': smsQueue,
  'push-queue': pushQueue,
  'payroll-queue': payrollQueue,
  'attendance-queue': attendanceQueue,
  'report-queue': reportQueue,
};

export const queueMonitorService = {
  getQueue(queueName) {
    return queueMap[queueName] || allQueues.find((q) => q.name === queueName);
  },

  async getQueueStats() {
    return Promise.all(
      allQueues.map(async (queue) => {
        try {
          const counts = await queue.getJobCounts(
            'waiting',
            'active',
            'completed',
            'failed',
            'delayed',
            'paused'
          );
          const isPaused = typeof queue.isPaused === 'function' ? await queue.isPaused() : false;
          return {
            name: queue.name,
            isPaused,
            ...counts,
          };
        } catch (err) {
          return {
            name: queue.name,
            isPaused: false,
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: 0,
            error: err.message,
          };
        }
      })
    );
  },

  async getQueueJobs(queueName, status = 'all', { page = 1, limit = 20 } = {}) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const statuses =
      status === 'all'
        ? ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused']
        : [status];

    const start = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const end = start + parseInt(limit, 10) - 1;

    const jobs = await queue.getJobs(statuses, start, end, true);

    const formattedJobs = await Promise.all(
      jobs.map(async (job) => {
        let state = 'unknown';
        try {
          if (typeof job.getState === 'function') {
            state = await job.getState();
          }
        } catch (e) {
          state = 'active';
        }

        return {
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
          state,
        };
      })
    );

    const counts = await queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused'
    );

    return {
      queue: queueName,
      counts,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: formattedJobs.length,
      jobs: formattedJobs,
    };
  },

  async retryJob(queueName, jobId) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in ${queueName}`);
    }

    await job.retry();
    return { id: job.id, name: job.name, status: 'retried' };
  },

  async removeJob(queueName, jobId) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in ${queueName}`);
    }

    await job.remove();
    return { id: jobId, status: 'removed' };
  },

  async pauseQueue(queueName) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    return { queue: queueName, status: 'paused' };
  },

  async resumeQueue(queueName) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    return { queue: queueName, status: 'resumed' };
  },

  async cleanQueue(queueName, gracePeriod = 1000 * 60 * 60 * 24, status = 'completed', limit = 1000) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const cleaned = await queue.clean(gracePeriod, limit, status);
    return { queue: queueName, cleanedCount: cleaned ? cleaned.length : 0, status };
  },

  async getQueueHealth() {
    const stats = await this.getQueueStats();
    const totalWaiting = stats.reduce((acc, q) => acc + (q.waiting || 0), 0);
    const totalActive = stats.reduce((acc, q) => acc + (q.active || 0), 0);
    const totalFailed = stats.reduce((acc, q) => acc + (q.failed || 0), 0);
    const totalCompleted = stats.reduce((acc, q) => acc + (q.completed || 0), 0);

    const isHealthy = totalFailed === 0 || totalFailed < totalCompleted + 10;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      queuesCount: allQueues.length,
      metrics: {
        totalWaiting,
        totalActive,
        totalFailed,
        totalCompleted,
      },
      queues: stats,
      timestamp: new Date().toISOString(),
    };
  },
};
