import api from './api.js';

export const authService = {
  /**
   * Log in user
   * @param {string} email 
   * @param {string} password 
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    // Backend returns: { status: 'ok', data: { user, accessToken, refreshToken } }
    return response.data?.data || response.data;
  },

  /**
   * Log out user
   */
  async logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Refresh JWT Token
   * @param {string} refreshToken 
   */
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data?.data || response.data;
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data?.data || response.data;
  },

  /**
   * Change current user's password
   * @param {string} oldPassword 
   * @param {string} newPassword 
   */
  async changePassword(oldPassword, newPassword) {
    const response = await api.post('/auth/change-password', { oldPassword, newPassword });
    return response.data?.data || response.data;
  }
};

export default authService;
