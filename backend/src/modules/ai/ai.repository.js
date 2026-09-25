import prisma from '../../config/prisma.js';

export class AIRepository {
  static async findActiveInsight({ companyId, employeeId, insightType, period }) {
    const where = {
      insightType,
      expiresAt: { gt: new Date() }
    };
    if (companyId) where.companyId = companyId;
    if (employeeId) where.employeeId = employeeId;
    if (period) where.period = period;

    return await prisma.aIInsight.findFirst({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createInsight(data) {
    return await prisma.aIInsight.create({ data });
  }

  static async listInsights({ companyId, employeeId, insightType, page = 1, limit = 20 }) {
    const where = {};
    if (companyId) where.companyId = companyId;
    if (employeeId) where.employeeId = employeeId;
    if (insightType) where.insightType = insightType;

    const skip = (page - 1) * limit;

    const [total, insights] = await Promise.all([
      prisma.aIInsight.count({ where }),
      prisma.aIInsight.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      insights
    };
  }

  static async createUsageLog(data) {
    return await prisma.aIUsageLog.create({ data });
  }

  static async getUsageMetrics({ companyId, startDate, endDate }) {
    const where = {};
    if (companyId) where.companyId = companyId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [totalLogs, tokensSum] = await Promise.all([
      prisma.aIUsageLog.count({ where }),
      prisma.aIUsageLog.aggregate({
        where,
        _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
        _avg: { latencyMs: true }
      })
    ]);

    return {
      totalRequests: totalLogs,
      totalTokens: tokensSum._sum.totalTokens || 0,
      avgLatencyMs: Math.round(tokensSum._avg.latencyMs || 0)
    };
  }
}

export default AIRepository;
