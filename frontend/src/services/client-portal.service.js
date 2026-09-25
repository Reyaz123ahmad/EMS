import api from './api.js';

export const clientPortalService = {
  async getDashboard() {
    const res = await api.get('/client-portal/dashboard');
    return res.data.data;
  },

  async getProjects(params = {}) {
    const res = await api.get('/client-portal/projects', { params });
    return res.data.data;
  },

  async getProjectDetail(id) {
    const res = await api.get(`/client-portal/projects/${id}`);
    return res.data.data;
  },

  async createRequirement(data) {
    const res = await api.post('/client-portal/requirements', data);
    return res.data.data;
  },

  async addComment(data) {
    const res = await api.post('/client-portal/comments', data);
    return res.data.data;
  },

  async getInvoices(params = {}) {
    const res = await api.get('/client-portal/invoices', { params });
    return res.data.data;
  },

  async getPayments(params = {}) {
    const res = await api.get('/client-portal/payments', { params });
    return res.data.data;
  }
};

export default clientPortalService;
