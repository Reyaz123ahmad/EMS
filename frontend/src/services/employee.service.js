import api from './api.js';

export const employeeService = {
  /**
   * Upload / Update self profile photo
   */
  async uploadMyPhoto(formDataOrBase64) {
    let payload = formDataOrBase64;
    let headers = {};
    if (formDataOrBase64 instanceof FormData) {
      headers = { 'Content-Type': 'multipart/form-data' };
    } else if (typeof formDataOrBase64 === 'string') {
      payload = { photo: formDataOrBase64 };
    }
    const response = await api.post('/employees/me/photo', payload, { headers });
    return response.data;
  },

  /**
   * Get self profile photo
   */
  async getMyPhoto() {
    const response = await api.get('/employees/me/photo');
    return response.data;
  },

  /**
   * Delete self profile photo
   */
  async deleteMyPhoto() {
    const response = await api.delete('/employees/me/photo');
    return response.data;
  },

  /**
   * Update self profile details (phone, emergency contact, etc.)
   */
  async updateMyProfile(data) {
    const response = await api.put('/employees/me/profile', data);
    return response.data;
  },
  /**
   * Step 1: Send Employee Verification OTP
   * @param {Object} data { employeeData, companyId }
   */
  async sendEmployeeOTP(data) {
    const response = await api.post('/employees/send-otp', data);
    return response.data;
  },

  /**
   * Step 2: Verify Employee Verification OTP
   * @param {Object} data { email, otp, sessionId }
   */
  async verifyEmployeeOTP(data) {
    const response = await api.post('/employees/verify-otp', data);
    return response.data;
  },

  /**
   * Step 3: Complete Employee and User account creation
   * @param {Object} data { sessionId, employeeData, companyId }
   */
  async createEmployeeWithUser(data) {
    const response = await api.post('/employees/create', data);
    return response.data;
  },

  /**
   * Fetch all employees
   * @param {Object} [params] { page, limit, departmentId, designationId, branchId, status, search }
   */
  async getEmployees(params = {}) {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  /**
   * Fetch employee by ID
   * @param {string} id
   */
  async getEmployee(id) {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  /**
   * Update employee
   * @param {string} id
   * @param {Object} data
   */
  async updateEmployee(id, data) {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  /**
   * Delete employee
   * @param {string} id
   */
  async deleteEmployee(id) {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  /**
   * Get employee dashboard summary
   * @param {string} id
   */
  async getEmployeeDashboard(id) {
    const response = await api.get(`/employees/${id}/dashboard`);
    return response.data;
  },

  /**
   * Register face biometric embedding
   * @param {string} id
   * @param {Object} data { photoUrl, embedding }
   */
  async registerFace(id, data) {
    const response = await api.post(`/employees/${id}/face`, data);
    return response.data;
  },

  /**
   * Bulk import employees
   * @param {Object} data { rows, companyId }
   */
  async bulkImportEmployees(data) {
    const response = await api.post('/employees/bulk-import', data);
    return response.data;
  },

  /**
   * Export employees
   * @param {Object} [params]
   */
  async exportEmployees(params = {}) {
    const response = await api.get('/employees/export', { params });
    return response.data;
  },

  /**
   * Get employee stats
   */
  async getEmployeeStats() {
    const response = await api.get('/employees/stats');
    return response.data;
  },

  /**
   * Get employee analytics
   */
  async getEmployeeAnalytics(params = {}) {
    const response = await api.get('/employees/analytics', { params });
    return response.data;
  }
};

export default employeeService;
