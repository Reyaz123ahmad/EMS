import authService from './auth.service.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyOTPSchema,
  sendOTPSchema
} from './auth.validator.js';

export const authController = {
  /**
   * POST /auth/login
   */
  async login(req, res, next) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const result = await authService.login({
        ...value,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress
      });

      res.status(200).json({
        status: 'ok',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/logout
   */
  async logout(req, res, next) {
    try {
      const refreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];
      if (refreshToken) {
        await authService.logout({ refreshToken }).catch(() => {});
      }
      return res.status(200).json({ status: 'ok', message: 'Logged out successfully' });
    } catch (err) {
      // Even on error, return success (client should clear)
      return res.status(200).json({ status: 'ok', message: 'Logged out' });
    }
  },

  /**
   * POST /auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const refreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];
      const result = await authService.refreshTokens({ refreshToken });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /auth/me
   */
  async getMe(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.sub;
      const user = await authService.getMe({ userId });
      res.status(200).json({ status: 'ok', data: { user } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const userId = req.user?.id || req.user?.sub;
      const result = await authService.changePassword({
        userId,
        oldPassword: value.oldPassword,
        newPassword: value.newPassword
      });

      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { error, value } = forgotPasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const result = await authService.forgotPassword(value);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { error, value } = resetPasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const result = await authService.resetPassword(value);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/verify-otp
   */
  async verifyOTP(req, res, next) {
    try {
      const { error, value } = verifyOTPSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const result = await authService.verifyOTP(value);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/send-otp
   */
  async sendOTP(req, res, next) {
    try {
      const { error, value } = sendOTPSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const result = await authService.sendOTP(value);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  }
};

export default authController;
