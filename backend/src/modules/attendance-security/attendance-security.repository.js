import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const attendanceSecurityRepository = {
  /**
   * Create a new liveness challenge in database
   */
  async createLivenessChallenge({ employeeId, challengeType, challengeData, expiresAt }) {
    return prisma.livenessChallenge.create({
      data: {
        employeeId,
        challengeType,
        challengeData: challengeData || {},
        expiresAt,
        verified: false
      }
    });
  },

  /**
   * Find active challenge by ID
   */
  async findActiveLivenessChallenge(id) {
    return prisma.livenessChallenge.findUnique({
      where: { id }
    });
  },

  /**
   * Update challenge status
   */
  async updateLivenessChallenge(id, data) {
    return prisma.livenessChallenge.update({
      where: { id },
      data
    });
  },

  /**
   * Create liveness verification log
   */
  async createLivenessVerification(data) {
    return prisma.livenessVerification.create({
      data: {
        employeeId: data.employeeId,
        livenessScore: data.livenessScore,
        isLive: data.isLive,
        challengeType: data.challengeType || null,
        challengePassed: data.challengePassed ?? null,
        photoUrl: data.photoUrl || null,
        metadata: data.metadata || {}
      }
    });
  },

  /**
   * Record a fraud signal incident
   */
  async createFraudSignal(data) {
    return prisma.fraudSignal.create({
      data: {
        companyId: data.companyId,
        employeeId: data.employeeId || null,
        signalType: data.signalType,
        severity: data.severity || 'MEDIUM',
        description: data.description || null,
        employeeLat: data.employeeLat !== undefined && data.employeeLat !== null ? data.employeeLat : null,
        employeeLng: data.employeeLng !== undefined && data.employeeLng !== null ? data.employeeLng : null,
        expectedLat: data.expectedLat !== undefined && data.expectedLat !== null ? data.expectedLat : null,
        expectedLng: data.expectedLng !== undefined && data.expectedLng !== null ? data.expectedLng : null,
        distanceMeters: data.distanceMeters !== undefined && data.distanceMeters !== null ? data.distanceMeters : null,
        metadata: data.metadata || {},
        reviewed: false
      }
    });
  },

  /**
   * Query fraud signals with filters and pagination
   */
  async findFraudSignals(companyId, filters = {}, pagination = { page: 1, limit: 20 }) {
    const { employeeId, signalType, severity, reviewed, startDate, endDate } = filters;
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where = { companyId };
    if (employeeId) where.employeeId = employeeId;
    if (signalType) where.signalType = signalType;
    if (severity) where.severity = severity;
    if (typeof reviewed === 'boolean') where.reviewed = reviewed;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, signals] = await Promise.all([
      prisma.fraudSignal.count({ where }),
      prisma.fraudSignal.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: { select: { name: true } },
              branch: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return {
      signals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Update fraud signal after review
   */
  async updateFraudSignal(id, data) {
    return prisma.fraudSignal.update({
      where: { id },
      data
    });
  },

  /**
   * Get statistical summary of fraud signals
   */
  async getFraudStats(companyId, dateRange = {}) {
    const where = { companyId };
    if (dateRange.startDate) {
      where.createdAt = { gte: new Date(dateRange.startDate) };
    }

    const [total, unreviewed, byTypeRaw, bySeverityRaw] = await Promise.all([
      prisma.fraudSignal.count({ where }),
      prisma.fraudSignal.count({ where: { ...where, reviewed: false } }),
      prisma.fraudSignal.groupBy({
        by: ['signalType'],
        where,
        _count: { id: true }
      }),
      prisma.fraudSignal.groupBy({
        by: ['severity'],
        where,
        _count: { id: true }
      })
    ]);

    const byType = {};
    byTypeRaw.forEach((item) => {
      byType[item.signalType] = item._count.id;
    });

    const bySeverity = {};
    bySeverityRaw.forEach((item) => {
      bySeverity[item.severity] = item._count.id;
    });

    return {
      total,
      unreviewed,
      reviewed: total - unreviewed,
      byType,
      bySeverity
    };
  }
};

export default attendanceSecurityRepository;
