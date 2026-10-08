import api from './api.js';

export const authService = {
  /**
   * Log in user (supports twoFactorToken)
   */
  async login(email, password, twoFactorToken = undefined) {
    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };
    if (twoFactorToken) {
      payload.twoFactorToken = String(twoFactorToken).trim();
    }
    const response = await api.post('/auth/login', payload);
    return response.data?.data || response.data;
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data?.data?.user || response.data?.user || response.data?.data || response.data;
  },

  /**
   * Change current user's password (PUT /auth/change-password)
   */
  async changePassword({ currentPassword, newPassword }) {
    const response = await api.put('/auth/change-password', {
      oldPassword: currentPassword,
      newPassword,
    });
    return response.data?.data || response.data;
  },

  /**
   * Request password reset code (POST /auth/forgot-password)
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
    return response.data?.data || response.data;
  },

  /**
   * Reset password with OTP (POST /auth/reset-password)
   */
  async resetPassword({ email, otp, newPassword }) {
    const response = await api.post('/auth/reset-password', {
      email: email.trim().toLowerCase(),
      otp: String(otp).trim(),
      newPassword,
    });
    return response.data?.data || response.data;
  },

  /**
   * Send generic OTP (POST /auth/send-otp)
   */
  async sendOTP({ email, purpose = 'LOGIN_2FA' }) {
    const response = await api.post('/auth/send-otp', {
      email: email.trim().toLowerCase(),
      purpose,
    });
    return response.data?.data || response.data;
  },

  /**
   * Verify generic OTP (POST /auth/verify-otp)
   */
  async verifyOTP({ email, otp, purpose = 'LOGIN_2FA' }) {
    const response = await api.post('/auth/verify-otp', {
      email: email.trim().toLowerCase(),
      otp: String(otp).trim(),
      purpose,
    });
    return response.data?.data || response.data;
  },

  /**
   * Log out user
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  },
};

export default authService;
