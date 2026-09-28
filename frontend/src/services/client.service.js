import api from './api.js';

export const clientService = {
  async getClients(params = {}) {
    const response = await api.get('/clients', { params });
    return response.data?.data || response.data;
  },

  async createClient(data) {
    const response = await api.post('/clients', data);
    return response.data?.data || response.data;
  }
};

export default clientService;
