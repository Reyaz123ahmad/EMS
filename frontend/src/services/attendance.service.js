import api from './api.js';

export const attendanceService = {
  /**
   * Check in with biometric photo, geo location and device attestation
   */
  async checkIn(data) {
    const response = await api.post('/attendance/check-in', data);
    return response.data;
  },

  /**
   * Check out
   */
  async checkOut(data) {
    const response = await api.post('/attendance/check-out', data);
    return response.data;
  },

  /**
   * Start a break interval
   */
  async startBreak(data) {
    const response = await api.post('/attendance/break-start', data);
    return response.data;
  },

  /**
   * End an ongoing break interval
   */
  async endBreak(data) {
    const response = await api.post('/attendance/break-end', data);
    return response.data;
  },

  /**
   * Get employee real-time status for today
   */
  async getTodayStatus(params = {}) {
    const response = await api.get('/attendance/today', { params });
    return response.data;
  },

  /**
   * List attendance logs with filters and pagination
   */
  async getAttendanceLogs(params = {}) {
    const response = await api.get('/attendance/logs', { params });
    return response.data;
  },

  /**
   * Monthly aggregated attendance summary
   */
  async getMonthlySummary(params = {}) {
    const response = await api.get('/attendance/monthly-summary', { params });
    return response.data;
  },

  /**
   * Attendance statistics dashboard summary
   */
  async getStats(params = {}) {
    const response = await api.get('/attendance/stats', { params });
    return response.data;
  },

  /**
   * Get security fraud signals
   */
  async getFraudSignals(params = {}) {
    const response = await api.get('/attendance/fraud-signals', { params });
    return response.data;
  },

  /**
   * Review fraud signal
   */
  async reviewFraudSignal(id, data) {
    const response = await api.post(`/attendance/fraud-signals/${id}/review`, data);
    return response.data;
  },

  /**
   * Card QR Attendance Scan
   */
  async cardScan(data) {
    const response = await api.post('/attendance/card-scan', data);
    return response.data;
  },

  /**
   * Calendar View
   */
  async getCalendar(params = {}) {
    const response = await api.get('/attendance/calendar', { params });
    return response.data;
  },

  /**
   * Employee Monthly Summary
   */
  async getEmployeeSummary(params = {}) {
    const response = await api.get('/attendance/employee-summary', { params });
    return response.data;
  },

  /**
   * Mark Manual Attendance
   */
  async markManual(data) {
    const response = await api.post('/attendance/manual', data);
    return response.data;
  },

  /**
   * Bulk Mark Attendance
   */
  async bulkMark(data) {
    const response = await api.post('/attendance/bulk-mark', data);
    return response.data;
  },

  /**
   * Get Attendance Exceptions
   */
  async getExceptions(params = {}) {
    const response = await api.get('/attendance/exceptions', { params });
    return response.data;
  },

  /**
   * Update Attendance Policy
   */
  async updatePolicy(data) {
    const response = await api.put('/attendance/policy', data);
    return response.data;
  }
};

export default attendanceService;
