import crypto from 'crypto';
import authRepository from './auth.repository.js';
import { comparePassword, hashPassword } from '../../security/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../../security/jwt.js';
import { addOTPEmail } from '../../queues/email.queue.js';
import { OTP_PURPOSES, OTP_EXPIRY_MINUTES, MAX_OTP_ATTEMPTS } from './auth.constants.js';
import env from '../../config/env.js';
import { AppError } from '../../utils/response.js';

export const authService = {
  /**
   * User login with 2FA support and BullMQ integration
   */
  async login({ email, password, twoFactorToken, userAgent, ipAddress }) {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      await authRepository.createLoginLog({
        email,
        ipAddress,
        userAgent,
        status: 'FAILED',
        failureReason: 'Invalid credentials'
      });
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'ACTIVE') {
      await authRepository.createLoginLog({
        userId: user.id,
        email,
        ipAddress,
        userAgent,
        status: 'FAILED',
        failureReason: `Account status is ${user.status}`
      });
      throw new AppError(`Your account is ${user.status.toLowerCase()}. Please contact administrator.`, 403);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await authRepository.createLoginLog({
        userId: user.id,
        email,
        ipAddress,
        userAgent,
        status: 'FAILED',
        failureReason: 'Incorrect password'
      });
      throw new AppError('Invalid email or password', 401);
    }

    // 2FA Verification Check
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        // Generate and send 2FA OTP via BullMQ
        const otp = crypto.randomInt(100000, 999999).toString();
        await authRepository.storeOTP(user.email, otp, OTP_PURPOSES.LOGIN_2FA, 5);
        try {
          await addOTPEmail({
            to: user.email,
            name: user.employee?.firstName || user.email,
            otp,
            purpose: 'Login Two-Factor Authentication',
            expiryMinutes: 5
          });
        } catch (queueErr) {
          // Fallback log if queue is unavailable
        }

        return {
          requires2FA: true,
          email: user.email,
          message: 'Two-factor authentication code sent to your email'
        };
      }

      // Verify supplied 2FA token
      const otpRecord = await authRepository.getOTP(user.email, OTP_PURPOSES.LOGIN_2FA);
      if (!otpRecord || otpRecord.otp !== twoFactorToken) {
        throw new AppError('Invalid or expired 2FA code', 400);
      }
      await authRepository.deleteOTP(user.email, OTP_PURPOSES.LOGIN_2FA);
    }

    // Determine primary role
    const primaryRole =
      user.userRoles?.[0]?.role?.name ||
      (user.email === env.SUPER_ADMIN_EMAIL ? 'SUPER_ADMIN' : 'EMPLOYEE');

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: primaryRole,
      companyId: user.companyId
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Persist refresh session
    const expiresAt = new Date(Date.now() + parseInt(env.JWT_REFRESH_EXPIRES_IN_DAYS, 10) * 86400000);
    await authRepository.createSession({
      userId: user.id,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt
    });

    // Update last login
    await authRepository.updateUser(user.id, { lastLoginAt: new Date() });

    // Successful login log
    await authRepository.createLoginLog({
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
      status: 'SUCCESS'
    });

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      companyId: user.companyId,
      company: user.company,
      role: primaryRole,
      roles: user.userRoles?.map((ur) => ur.role?.name) || [primaryRole],
      employee: user.employee,
      twoFactorEnabled: user.twoFactorEnabled
    };

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken
    };
  },

  /**
   * User logout and invalidate session
   */
  async logout({ refreshToken }) {
    if (refreshToken) {
      await authRepository.deleteSession(refreshToken);
    }
    return { success: true };
  },

  /**
   * Refresh Access and Refresh tokens
   */
  async refreshTokens({ refreshToken }) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const decoded = verifyRefreshToken(refreshToken);
    const session = await authRepository.findSessionByToken(refreshToken);

    if (!session || new Date() > session.expiresAt) {
      throw new AppError('Session has expired. Please sign in again.', 401);
    }

    const user = await authRepository.findUserById(decoded.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('User not found or inactive', 401);
    }

    const primaryRole =
      user.userRoles?.[0]?.role?.name ||
      (user.email === env.SUPER_ADMIN_EMAIL ? 'SUPER_ADMIN' : 'EMPLOYEE');

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: primaryRole,
      companyId: user.companyId
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Rotate session
    await authRepository.deleteSession(refreshToken);
    const expiresAt = new Date(Date.now() + parseInt(env.JWT_REFRESH_EXPIRES_IN_DAYS, 10) * 86400000);
    await authRepository.createSession({
      userId: user.id,
      refreshToken: newRefreshToken,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      expiresAt
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  },

  /**
   * Get current authenticated user profile
   */
  async getMe({ userId }) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const primaryRole =
      user.userRoles?.[0]?.role?.name ||
      (user.email === env.SUPER_ADMIN_EMAIL ? 'SUPER_ADMIN' : 'EMPLOYEE');

    let employee = user.employee;
    if (!employee && user.companyId && primaryRole !== 'SUPER_ADMIN' && primaryRole !== 'CLIENT') {
      const empCode = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
      employee = await prisma.employee.create({
        data: {
          companyId: user.companyId,
          userId: user.id,
          employeeCode: empCode,
          firstName: user.email.split('@')[0],
          lastName: 'User',
          email: user.email,
          joiningDate: new Date(),
          status: 'ACTIVE'
        },
        include: { department: true, designation: true, branch: true }
      }).catch(async () => {
        return await prisma.employee.findFirst({ where: { userId: user.id } });
      });
    }

    const photoUrl = employee?.photoUrl || null;
    const name = employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() : user.email.split('@')[0];

    return {
      id: user.id,
      email: user.email,
      name,
      phone: user.phone || employee?.phone || null,
      photoUrl,
      companyId: user.companyId,
      company: user.company,
      role: primaryRole,
      roles: user.userRoles?.map((ur) => ur.role?.name) || [primaryRole],
      employee: employee ? { ...employee, photoUrl } : null,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt
    };
  },

  /**
   * Change current user's password
   */
  async changePassword({ userId, oldPassword, newPassword }) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    const newHash = await hashPassword(newPassword);
    await authRepository.updateUser(userId, { passwordHash: newHash });
    await authRepository.deleteAllUserSessions(userId);

    return { success: true, message: 'Password updated successfully' };
  },

  /**
   * Initiate Forgot Password flow with BullMQ OTP email
   */
  async forgotPassword({ email }) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      // Return success to prevent email enumeration
      return { success: true, message: 'If an account exists, a reset code was sent.' };
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    await authRepository.storeOTP(user.email, otp, OTP_PURPOSES.PASSWORD_RESET, OTP_EXPIRY_MINUTES);

    // Dispatch email asynchronously
    addOTPEmail({
      to: user.email,
      name: user.employee?.firstName || user.email,
      otp,
      purpose: 'Password Reset',
      expiryMinutes: OTP_EXPIRY_MINUTES
    }).catch(() => {});

    return { success: true, message: 'Verification code sent to your email.' };
  },

  /**
   * Reset Password with OTP verification
   */
  async resetPassword({ email, otp, newPassword }) {
    const otpRecord = await authRepository.getOTP(email, OTP_PURPOSES.PASSWORD_RESET);
    if (!otpRecord) {
      throw new AppError('OTP has expired or does not exist. Please request a new code.', 400);
    }

    if (otpRecord.otp !== String(otp).trim()) {
      throw new AppError('Invalid OTP code', 400);
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updateUser(user.id, { passwordHash });
    await authRepository.deleteOTP(email, OTP_PURPOSES.PASSWORD_RESET);
    await authRepository.deleteAllUserSessions(user.id);

    return { success: true, message: 'Password reset successfully. You can now sign in.' };
  },

  /**
   * Generic OTP Verification
   */
  async verifyOTP({ email, otp, purpose = 'DEFAULT' }) {
    const otpRecord = await authRepository.getOTP(email, purpose);
    if (!otpRecord || otpRecord.otp !== String(otp).trim()) {
      const error = new Error('Invalid or expired OTP code');
      error.statusCode = 400;
      throw error;
    }
    await authRepository.deleteOTP(email, purpose);
    return { verified: true };
  },

  /**
   * Generic Send OTP
   */
  async sendOTP({ email, purpose = 'DEFAULT' }) {
    const otp = crypto.randomInt(100000, 999999).toString();
    await authRepository.storeOTP(email, otp, purpose, OTP_EXPIRY_MINUTES);

    await addOTPEmail({
      to: email,
      name: 'Valued User',
      otp,
      purpose: purpose.replace(/_/g, ' '),
      expiryMinutes: OTP_EXPIRY_MINUTES
    });

    return { success: true, message: 'OTP sent successfully' };
  }
};

export default authService;
