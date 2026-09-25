import api from './api.js';

export const queueService = {
  /**
   * Get metrics across all BullMQ queues
   */
  async getQueueStats() {
    const response = await api.get('/admin/queues/stats');
    return response.data?.data || [];
  },

  /**
   * Get jobs for a specific queue
   * @param {string} queueName 
   * @param {string} [status='all'] 
   * @param {number} [page=1] 
   * @param {number} [limit=20] 
   */
  async getQueueJobs(queueName, status = 'all', page = 1, limit = 20) {
    const response = await api.get(`/admin/queues/${queueName}/jobs`, {
      params: { status, page, limit }
    });
    return response.data?.data || { jobs: [], total: 0 };
  },

  /**
   * Retry a failed job in a queue
   * @param {string} queueName 
   * @param {string} jobId 
   */
  async retryJob(queueName, jobId) {
    const response = await api.post(`/admin/queues/${queueName}/${jobId}/retry`);
    return response.data;
  }
};

export default queueService;
