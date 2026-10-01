import prisma from '../../config/prisma.js';

export const advancedSecurityRepository = {
  findDeviceAttestation: async (deviceId) => {
    return prisma.deviceAttestation.findUnique({
      where: { deviceId }
    });
  },

  upsertDeviceAttestation: async (data) => {
    return prisma.deviceAttestation.upsert({
      where: { deviceId: data.deviceId },
      create: {
        deviceId: data.deviceId,
        platform: data.platform || 'android',
        provider: data.provider || 'PLAY_INTEGRITY',
        attestationToken: data.attestationToken,
        integrityLevel: data.integrityLevel || 'STRONG',
        isRooted: data.isRooted || false,
        isEmulator: data.isEmulator || false,
        isTampered: data.isTampered || false,
        passed: data.passed !== false,
        failureReason: data.failureReason || null,
        metadata: data.metadata || null,
        lastAttestedAt: new Date()
      },
      update: {
        platform: data.platform || 'android',
        provider: data.provider || 'PLAY_INTEGRITY',
        attestationToken: data.attestationToken,
        integrityLevel: data.integrityLevel || 'STRONG',
        isRooted: data.isRooted || false,
        isEmulator: data.isEmulator || false,
        isTampered: data.isTampered || false,
        passed: data.passed !== false,
        failureReason: data.failureReason || null,
        metadata: data.metadata || null,
        lastAttestedAt: new Date(),
        updatedAt: new Date()
      }
    });
  },

  findCompanySecuritySettings: async (companyId) => {
    if (!companyId) return {};
    if (!global._secSettingsCache) global._secSettingsCache = new Map();
    const cached = global._secSettingsCache.get(companyId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { securitySettings: true }
    });
    const data = company?.securitySettings || {};
    global._secSettingsCache.set(companyId, { data, expiresAt: Date.now() + 60000 });
    return data;
  },

  updateCompanySecuritySettings: async (companyId, settings) => {
    return prisma.company.update({
      where: { id: companyId },
      data: {
        securitySettings: settings
      }
    });
  },

  findFraudSignals: async (companyId, filters = {}, pagination = { page: 1, limit: 10 }) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = { companyId };
    if (filters.signalType) where.signalType = filters.signalType;
    if (filters.severity) where.severity = filters.severity;
    if (filters.reviewed !== undefined) where.reviewed = filters.reviewed === 'true' || filters.reviewed === true;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    const [total, signals] = await Promise.all([
      prisma.fraudSignal.count({ where }),
      prisma.fraudSignal.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
          }
        }
      })
    ]);

    return {
      signals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  findFraudSignalById: async (id) => {
    return prisma.fraudSignal.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
        }
      }
    });
  },

  updateFraudSignal: async (id, data) => {
    return prisma.fraudSignal.update({
      where: { id },
      data
    });
  },

  countSecurityMetrics: async (companyId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalFraudSignals, pendingFraudSignals, trustedDevicesCount, failedAttestations] = await Promise.all([
      prisma.fraudSignal.count({ where: { companyId } }),
      prisma.fraudSignal.count({ where: { companyId, reviewed: false } }),
      prisma.deviceAttestation.count({ where: { passed: true } }),
      prisma.deviceAttestation.count({ where: { passed: false } })
    ]);

    return {
      totalFraudSignals,
      pendingFraudSignals,
      trustedDevicesCount,
      failedAttestations
    };
  }
};

export default advancedSecurityRepository;
