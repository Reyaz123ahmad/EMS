import api from './api';

export const biometricDevicesService = {
  createDevice: async (data) => {
    const response = await api.post('/biometric/devices', data);
    return response.data;
  },

  listDevices: async (params = {}) => {
    const response = await api.get('/biometric/devices', { params });
    return response.data;
  },

  getDevice: async (id) => {
    const response = await api.get(`/biometric/devices/${id}`);
    return response.data;
  },

  updateDevice: async (id, data) => {
    const response = await api.put(`/biometric/devices/${id}`, data);
    return response.data;
  },

  deactivateDevice: async (id) => {
    const response = await api.delete(`/biometric/devices/${id}`);
    return response.data;
  },

  regenerateApiKey: async (id) => {
    const response = await api.post(`/biometric/devices/${id}/regenerate-key`);
    return response.data;
  },

  getDeviceStatus: async (id) => {
    const response = await api.get(`/biometric/devices/${id}/status`);
    return response.data;
  },

  listPunches: async (params = {}) => {
    const response = await api.get('/biometric/punches', { params });
    return response.data;
  },

  reprocessPunch: async (id) => {
    const response = await api.post(`/biometric/punches/${id}/reprocess`);
    return response.data;
  },

  getPunchStats: async (params = {}) => {
    const response = await api.get('/biometric/stats', { params });
    return response.data;
  }
};

export default biometricDevicesService;
