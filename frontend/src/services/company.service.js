import api from './api.js';

export const companyService = {
  /**
   * Step 1: Send Company & Admin Verification OTP
   * @param {Object} data { companyData, adminData }
   */
  async sendCompanyOTP(data) {
    const response = await api.post('/companies/send-otp', data);
    return response.data;
  },

  /**
   * Step 2: Verify Company OTP
   * @param {Object} data { email, otp, sessionId }
   */
  async verifyCompanyOTP(data) {
    const response = await api.post('/companies/verify-otp', data);
    return response.data;
  },

  /**
   * Step 3: Create Company and Admin Account
   * @param {Object} data { sessionId, companyData, adminData }
   */
  async createCompanyWithAdmin(data) {
    const response = await api.post('/companies/create', data);
    return response.data;
  },

  /**
   * Fetch all companies (Super Admin)
   * @param {Object} [params] { page, limit, search, status }
   */
  async getCompanies(params = {}) {
    const response = await api.get('/companies', { params });
    return response.data;
  },

  /**
   * Fetch company by ID
   * @param {string} id
   */
  async getCompany(id) {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  /**
   * Update existing company
   * @param {string} id
   * @param {Object} data
   */
  async updateCompany(id, data) {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  /**
   * Get company configuration settings
   * @param {string} id
   */
  async getCompanySettings(id) {
    const response = await api.get(`/companies/${id}/settings`);
    return response.data;
  },

  /**
   * Update company configuration settings
   * @param {string} id
   * @param {string} settingsType
   * @param {Object} settingsData
   */
  async updateCompanySettings(id, settingsType, settingsData) {
    const response = await api.put(`/companies/${id}/settings`, {
      settingsType,
      settingsData
    });
    return response.data;
  },

  /**
   * Get company analytics dashboard
   * @param {string} id
   */
  async getCompanyDashboard(id) {
    const response = await api.get(`/companies/${id}/dashboard`);
    return response.data;
  },

  /**
   * Get overall company stats
   */
  async getCompanyStats() {
    const response = await api.get('/companies/stats');
    return response.data;
  },

  /**
   * Get company analytics
   */
  async getCompanyAnalytics(params = {}) {
    const response = await api.get('/companies/analytics', { params });
    return response.data;
  }
};

export default companyService;
