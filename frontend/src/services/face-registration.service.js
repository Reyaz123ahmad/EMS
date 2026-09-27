import api from './api';

export const faceRegistrationService = {
  registerFace: async (data) => {
    const response = await api.post('/face/register', data);
    return response.data;
  },

  updateFace: async (data) => {
    const response = await api.put('/face/update', data);
    return response.data;
  },

  deleteFace: async (data) => {
    const response = await api.delete('/face/delete', { data });
    return response.data;
  },

  verifyFace: async (data) => {
    const response = await api.post('/face/verify', data);
    return response.data;
  },

  getFaceStatus: async (employeeId) => {
    const response = await api.get(`/face/status/${employeeId}`);
    return response.data;
  },

  listWithFace: async (params = {}) => {
    const response = await api.get('/face/with-face', { params });
    return response.data;
  },

  listWithoutFace: async (params = {}) => {
    const response = await api.get('/face/without-face', { params });
    return response.data;
  },

  bulkRegister: async (data) => {
    const response = await api.post('/face/bulk-register', data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/face/stats');
    return response.data;
  },

  exportEmbeddings: async () => {
    const response = await api.get('/face/export');
    return response.data;
  },

  getMyStatus: async () => {
    const response = await api.get('/face/my-status');
    return response.data?.data || response.data;
  },

  listPendingRequests: async (params = {}) => {
    const response = await api.get('/face/pending', { params });
    return response.data?.data || response.data;
  },

  approveRequest: async (requestId) => {
    const response = await api.post(`/face/${requestId}/approve`);
    return response.data?.data || response.data;
  },

  rejectRequest: async (requestId, reason) => {
    const response = await api.post(`/face/${requestId}/reject`, { reason });
    return response.data?.data || response.data;
  }
};

export default faceRegistrationService;
