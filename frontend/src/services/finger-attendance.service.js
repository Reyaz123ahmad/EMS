import api from './api';

export const fingerAttendanceService = {
  enrollFinger: async (data) => {
    const response = await api.post('/finger/enroll', data);
    return response.data;
  },

  deleteFingerEnrollment: async (employeeId, fingerIndex) => {
    const response = await api.delete(`/finger/enroll/${employeeId}/${fingerIndex}`);
    return response.data;
  },

  getEmployeeEnrollments: async (employeeId) => {
    const response = await api.get(`/finger/enroll/${employeeId}`);
    return response.data;
  },

  listFingerPunches: async (params = {}) => {
    const response = await api.get('/finger/punches', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/finger/stats');
    return response.data;
  },

  syncToDevice: async (deviceId) => {
    const response = await api.post(`/finger/sync/${deviceId}`);
    return response.data;
  }
};

export default fingerAttendanceService;
