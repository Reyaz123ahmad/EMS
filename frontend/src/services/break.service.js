import api from './api.js';

export const breakService = {
  async getBreakRules(params = {}) {
    const response = await api.get('/breaks', { params });
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    return [];
  },

  async getBreakRule(id) {
    const response = await api.get(`/breaks/${id}`);
    return response.data?.data || response.data;
  },

  async createBreakRule(data) {
    const response = await api.post('/breaks', data);
    return response.data?.data || response.data;
  },

  async updateBreakRule(id, data) {
    const response = await api.put(`/breaks/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteBreakRule(id) {
    const response = await api.delete(`/breaks/${id}`);
    return response.data?.data || response.data;
  }
};

export default breakService;
