import api from './api.js';

export const queueMonitorService = {
  async getQueueStats() {
    const response = await api.get('/admin/queues/stats');
    return response.data?.data || [];
  },

  async getQueueHealth() {
    const response = await api.get('/admin/queues/health');
    return response.data?.data;
  },

  async getQueueJobs(queueName, params = {}) {
    const response = await api.get(`/admin/queues/${queueName}/jobs`, { params });
    return response.data?.data;
  },

  async retryJob(queueName, jobId) {
    const response = await api.post(`/admin/queues/${queueName}/${jobId}/retry`);
    return response.data?.data;
  },

  async removeJob(queueName, jobId) {
    const response = await api.delete(`/admin/queues/${queueName}/${jobId}`);
    return response.data?.data;
  },

  async pauseQueue(queueName) {
    const response = await api.post(`/admin/queues/${queueName}/pause`);
    return response.data?.data;
  },

  async resumeQueue(queueName) {
    const response = await api.post(`/admin/queues/${queueName}/resume`);
    return response.data?.data;
  },

  async cleanQueue(queueName, data = {}) {
    const response = await api.post(`/admin/queues/${queueName}/clean`, data);
    return response.data?.data;
  },
};

export default queueMonitorService;
