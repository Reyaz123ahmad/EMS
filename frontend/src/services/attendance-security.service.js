import api from './api.js';

export const attendanceSecurityService = {
  /**
   * Request randomized liveness challenge
   */
  async createLivenessChallenge(data = {}) {
    const response = await api.post('/attendance-security/liveness/challenge', data);
    return response.data;
  },

  /**
   * Submit challenge completion for verification
   */
  async verifyLiveness(data) {
    const response = await api.post('/attendance-security/liveness/verify', data);
    return response.data;
  },

  /**
   * Get all fraud signal logs
   */
  async getFraudSignals(params = {}) {
    const response = await api.get('/attendance-security/fraud-signals', { params });
    return response.data;
  },

  /**
   * Review a fraud signal
   */
  async reviewFraudSignal(id, data) {
    const response = await api.post(`/attendance-security/fraud-signals/${id}/review`, data);
    return response.data;
  },

  /**
   * Get fraud metrics and summary
   */
  async getFraudStats(params = {}) {
    const response = await api.get('/attendance-security/fraud-stats', { params });
    return response.data;
  }
};

export default attendanceSecurityService;
