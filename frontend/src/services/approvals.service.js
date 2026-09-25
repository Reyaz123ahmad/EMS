import api from './api.js';

export const approvalsService = {
  async getWorkflows(params = {}) {
    const response = await api.get('/approvals/workflows', { params });
    return response.data?.data || [];
  },

  async getWorkflowById(id) {
    const response = await api.get(`/approvals/workflows/${id}`);
    return response.data?.data;
  },

  async createWorkflow(data) {
    const response = await api.post('/approvals/workflows', data);
    return response.data?.data;
  },

  async updateWorkflow(id, data) {
    const response = await api.put(`/approvals/workflows/${id}`, data);
    return response.data?.data;
  },

  async deleteWorkflow(id) {
    const response = await api.delete(`/approvals/workflows/${id}`);
    return response.data;
  },

  async getRequests(params = {}) {
    const response = await api.get('/approvals/requests', { params });
    return response.data?.data || [];
  },

  async createRequest(data) {
    const response = await api.post('/approvals/requests', data);
    return response.data?.data;
  },

  async actOnRequest(requestId, data) {
    const response = await api.post(`/approvals/requests/${requestId}/action`, data);
    return response.data?.data;
  },

  async getPendingApprovals(params = {}) {
    const response = await api.get('/approvals/pending', { params });
    return response.data?.data || [];
  },

  async getApprovalHistory(params = {}) {
    const response = await api.get('/approvals/history', { params });
    return response.data?.data || [];
  },

  async getApprovalStats() {
    const response = await api.get('/approvals/stats');
    return response.data?.data;
  },
};

export default approvalsService;
