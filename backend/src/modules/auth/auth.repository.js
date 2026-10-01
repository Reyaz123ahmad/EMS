import prisma from '../../config/prisma.js';
import redis from '../../config/redis.js';
import { OTP_EXPIRY_MINUTES } from './auth.constants.js';

export const authRepository = {
  /**
   * Find user by unique email with company, employee and roles
   * @param {string} email 
   */
  async findUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    if (!global._userEmailCache) global._userEmailCache = new Map();
    const cached = global._userEmailCache.get(cleanEmail);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    try {
      const rows = await prisma.$queryRaw`
        SELECT 
          u.id, u.email, u."passwordHash", u.status, u."twoFactorEnabled", u.phone, u."companyId",
          c.name as "companyName", c.domain as "companyDomain", c."logoUrl" as "companyLogoUrl", c."companyCode" as "companyCode", c.status as "companyStatus",
          e.id as "employeeId", e."firstName", e."lastName", e."employeeCode", e."departmentId", e."designationId", e."branchId", e.status as "employeeStatus",
          r.id as "roleId", r.name as "roleName", r."displayName" as "roleDisplayName"
        FROM users u
        LEFT JOIN companies c ON u."companyId" = c.id
        LEFT JOIN employees e ON u.id = e."userId"
        LEFT JOIN user_roles ur ON u.id = ur."userId"
        LEFT JOIN roles r ON ur."roleId" = r.id
        WHERE LOWER(u.email) = ${cleanEmail}
        LIMIT 1
      `;

      if (rows && rows.length > 0) {
        const row = rows[0];
        const formatted = {
          id: row.id,
          email: row.email,
          passwordHash: row.passwordHash,
          status: row.status,
          twoFactorEnabled: row.twoFactorEnabled,
          phone: row.phone,
          companyId: row.companyId,
          company: row.companyName ? {
            id: row.companyId,
            name: row.companyName,
            domain: row.companyDomain,
            logoUrl: row.companyLogoUrl,
            companyCode: row.companyCode,
            status: row.companyStatus
          } : null,
          employee: row.employeeId ? {
            id: row.employeeId,
            firstName: row.firstName,
            lastName: row.lastName,
            employeeCode: row.employeeCode,
            departmentId: row.departmentId,
            designationId: row.designationId,
            branchId: row.branchId,
            status: row.employeeStatus
          } : null,
          userRoles: row.roleId ? [{
            role: {
              id: row.roleId,
              name: row.roleName,
              displayName: row.roleDisplayName
            }
          }] : []
        };
        global._userEmailCache.set(cleanEmail, { data: formatted, expiresAt: Date.now() + 300000 });
        return formatted;
      }
    } catch (err) {
      // Fallback to Prisma findUnique if raw query encounters any schema mapping issue
      const fallbackData = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          status: true,
          twoFactorEnabled: true,
          phone: true,
          companyId: true,
          company: { select: { id: true, name: true, domain: true, logoUrl: true, companyCode: true, status: true } },
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, departmentId: true, designationId: true, branchId: true, status: true } },
          userRoles: { select: { role: { select: { id: true, name: true, displayName: true } } } }
        }
      });
      if (fallbackData) {
        global._userEmailCache.set(cleanEmail, { data: fallbackData, expiresAt: Date.now() + 300000 });
      }
      return fallbackData;
    }

    return null;
  },

  /**
   * Find user by ID with company and roles (optimized)
   * @param {string} id 
   */
  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        status: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
            logoUrl: true,
            companyCode: true,
            status: true
          }
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            photoUrl: true,
            departmentId: true,
            designationId: true,
            branchId: true
          }
        },
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true
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
