import prisma from '../../config/prisma.js';
import redis from '../../config/redis.js';
import { OTP_EXPIRY_MINUTES } from './auth.constants.js';

export const authRepository = {
  /**
   * Find user by unique email with company, employee and roles
   * @param {string} email 
   */
  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          include: {
            subscription: {
              include: { plan: true }
            }
          }
        },
        employee: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });
  },

  /**
   * Find user by ID with company and roles
   * @param {string} id 
   */
  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            subscription: {
              include: { plan: true }
            }
          }
        },
        employee: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });
  },

  /**
   * Create a new user record
   * @param {Object} data 
   */
  async createUser(data) {
    return prisma.user.create({ data });
  },

  /**
   * Update existing user
   * @param {string} id 
   * @param {Object} data 
   */
  async updateUser(id, data) {
    return prisma.user.update({
      where: { id },
      data
    });
  },

  /**
   * Create new login session with refresh token
   * @param {Object} data 
   */
  async createSession({ userId, refreshToken, userAgent, ipAddress, expiresAt }) {
    return prisma.session.create({
      data: {
        userId,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt
      }
    });
  },

  /**
   * Find session by refresh token
   * @param {string} refreshToken 
   */
  async findSessionByToken(refreshToken) {
    return prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    });
  },

  /**
   * Delete session by refresh token
   * @param {string} refreshToken 
   */
  async deleteSession(refreshToken) {
    return prisma.session.deleteMany({
      where: { refreshToken }
    });
  },

  /**
   * Delete all sessions for a user
   * @param {string} userId 
   */
  async deleteAllUserSessions(userId) {
    return prisma.session.deleteMany({
      where: { userId }
    });
  },

  /**
   * Log user login attempt
   * @param {Object} logData 
   */
  async createLoginLog(logData) {
    return prisma.loginLog.create({ data: logData });
  },

  /**
   * Create an audit log entry
   * @param {Object} auditData 
   */
  async createAuditLog(auditData) {
    return prisma.auditLog.create({ data: auditData });
  },

  /**
   * Create security event entry
   * @param {Object} eventData 
   */
  async createSecurityEvent(eventData) {
    return prisma.securityEvent.create({ data: eventData });
  },

  /**
   * Store OTP in Redis with expiration
   * @param {string} email 
   * @param {string} otp 
   * @param {string} purpose 
   * @param {number} expiryMinutes 
   */
  async storeOTP(email, otp, purpose = 'DEFAULT', expiryMinutes = OTP_EXPIRY_MINUTES) {
    const key = `otp:${purpose}:${email.toLowerCase()}`;
    const payload = JSON.stringify({
      otp,
      attempts: 0,
      createdAt: Date.now()
    });
    if (redis) {
      await redis.set(key, payload, 'EX', expiryMinutes * 60);
    }
    return { email, otp, purpose };
  },

  /**
   * Get OTP record from Redis
   * @param {string} email 
   * @param {string} purpose 
   */
  async getOTP(email, purpose = 'DEFAULT') {
    const key = `otp:${purpose}:${email.toLowerCase()}`;
    if (!redis) return null;
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  },

  /**
   * Delete OTP from Redis
   * @param {string} email 
   * @param {string} purpose 
   */
  async deleteOTP(email, purpose = 'DEFAULT') {
    const key = `otp:${purpose}:${email.toLowerCase()}`;
    if (redis) {
      await redis.del(key);
    }
  }
};

export default authRepository;
