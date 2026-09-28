import api from './api.js';

export const biometricCardService = {
  async listCards(params = {}) {
    const response = await api.get('/biometric-cards', { params });
    return response.data?.data || response.data;
  },

  async getMyCard() {
    const response = await api.get('/biometric-cards/my');
    return response.data?.data || response.data;
  },

  async generateCard(data) {
    const response = await api.post('/biometric-cards/generate', data);
    return response.data?.data || response.data;
  },

  async assignCard(data) {
    const response = await api.post('/biometric-cards/assign', data);
    return response.data?.data || response.data;
  },

  async getCard(id) {
    const response = await api.get(`/biometric-cards/${id}`);
    return response.data?.data || response.data;
  },

  async deactivateCard(id) {
    const response = await api.post(`/biometric-cards/${id}/deactivate`);
    return response.data?.data || response.data;
  },

  async downloadCard(id) {
    const response = await api.get(`/biometric-cards/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async verifyQR(qrData) {
    const response = await api.post('/biometric-cards/verify-qr', { qrData });
    return response.data?.data || response.data;
  }
};

export default biometricCardService;
