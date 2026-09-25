import api from './api';

export const biometricCardsService = {
  generateCard: async (data) => {
    const response = await api.post('/biometric/cards/generate', data);
    return response.data;
  },

  assignCard: async (data) => {
    const response = await api.post('/biometric/cards/assign', data);
    return response.data;
  },

  regenerateQR: async (cardId) => {
    const response = await api.post(`/biometric/cards/${cardId}/regenerate`);
    return response.data;
  },

  deactivateCard: async (cardId, reason) => {
    const response = await api.post(`/biometric/cards/${cardId}/deactivate`, { reason });
    return response.data;
  },

  getCardByEmployee: async (employeeId) => {
    const response = await api.get(`/biometric/cards/employee/${employeeId}`);
    return response.data;
  },

  listCards: async (params = {}) => {
    const response = await api.get('/biometric/cards', { params });
    return response.data;
  },

  downloadCard: async (cardId) => {
    const response = await api.get(`/biometric/cards/${cardId}/download`);
    return response.data;
  },

  verifyQR: async (qrData) => {
    const response = await api.post('/biometric/cards/verify-qr', { qrData });
    return response.data;
  }
};

export default biometricCardsService;
