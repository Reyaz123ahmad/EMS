import api from './api.js';

export const overtimeService = {
  async getRules() {
    const response = await api.get('/overtime/rules');
    return response.data;
  },

  async createRule(data) {
    const response = await api.post('/overtime/rules', data);
    return response.data;
  },

  async updateRule(id, data) {
    const response = await api.put(`/overtime/rules/${id}`, data);
    return response.data;
  },

  async deleteRule(id) {
    const response = await api.delete(`/overtime/rules/${id}`);
    return response.data;
  },

  async getRecords(params = {}) {
    const response = await api.get('/overtime/records', { params });
    return response.data;
  },

  async calculate(data) {
    const response = await api.post('/overtime/calculate', data);
    return response.data;
  },

  async apply(data) {
    const response = await api.post('/overtime/apply', data);
    return response.data;
  },

  async getRequests(params = {}) {
    const response = await api.get('/overtime/requests', { params });
    return response.data;
  },

  async approveRequest(id) {
    const response = await api.post(`/overtime/requests/${id}/approve`);
    return response.data;
  },

  async rejectRequest(id) {
    const response = await api.post(`/overtime/requests/${id}/reject`);
    return response.data;
  },

  async bulkApprove(data) {
    const response = await api.post('/overtime/requests/bulk-approve', data);
    return response.data;
  },

  async getStats(params = {}) {
    const response = await api.get('/overtime/stats', { params });
    return response.data;
  },

  async getReport(params = {}) {
    const response = await api.get('/overtime/report', { params });
    return response.data;
  }
};

export default overtimeService;
