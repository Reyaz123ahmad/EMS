import api from './api.js';

export const reportService = {
  async generateReport(data) {
    const response = await api.post('/reports/generate', data);
    return response.data;
  },

  async exportReport(data) {
    const response = await api.post('/reports/export', data);
    return response.data;
  },

  async getReportStats() {
    const response = await api.get('/reports/stats');
    return response.data;
  },

  async getReportHistory(params = {}) {
    const response = await api.get('/reports/history', { params });
    return response.data;
  }
};

export default reportService;
