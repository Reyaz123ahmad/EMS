import api from './api.js';

export const refundService = {
  async requestRefund(data) {
    const res = await api.post('/refunds/request', data);
    return res.data.data;
  },

  async listRefunds(params = {}) {
    const res = await api.get('/refunds', { params });
    return res.data.data;
  },

  async listAllRefunds(params = {}) {
    const res = await api.get('/refunds/all', { params });
    return res.data.data;
  },

  async getRefundById(id) {
    const res = await api.get(`/refunds/${id}`);
    return res.data.data;
  },

  async approveRefund(id, data = {}) {
    const res = await api.post(`/refunds/${id}/approve`, data);
    return res.data.data;
  },

  async rejectRefund(id, data) {
    const res = await api.post(`/refunds/${id}/reject`, data);
    return res.data.data;
  },

  async processRefund(id, data = {}) {
    const res = await api.post(`/refunds/${id}/process`, data);
    return res.data.data;
  },

  async retryRefund(id) {
    const res = await api.post(`/refunds/${id}/retry`);
    return res.data.data;
  },

  async systemIssueRefund(data) {
    const res = await api.post('/refunds/system-issue', data);
    return res.data.data;
  },

  async getRefundStats(params = {}) {
    const res = await api.get('/refunds/stats', { params });
    return res.data.data;
  }
};

export default refundService;
