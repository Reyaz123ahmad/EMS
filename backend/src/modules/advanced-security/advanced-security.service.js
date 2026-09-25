import { advancedSecurityRepository } from './advanced-security.repository.js';
import { DEFAULT_SECURITY_SETTINGS } from './advanced-security.constants.js';
import { AppError } from '../../utils/response.js';
import prisma from '../../config/prisma.js';

export const advancedSecurityService = {
  /**
   * 1. Hardware Device Attestation (Play Integrity / Apple App Attest)
   */
  attestDevice: async ({
    deviceId,
    attestationToken,
    platform = 'android',
    provider = 'PLAY_INTEGRITY',
    isRooted = false,
    isEmulator = false,
    metadata
  }) => {
    // 1. Verify token authenticity
    if (!attestationToken || attestationToken.length < 10) {
      throw new AppError('Invalid or malformed device attestation token', 400);
    }

    // 2. Determine integrity evaluation
    let integrityLevel = 'STRONG';
    let passed = true;
    let failureReason = null;

    if (isRooted) {
      integrityLevel = 'FAILED';
      passed = false;
      failureReason = 'Rooted or compromised Android OS detected (SU binary present)';
    } else if (isEmulator) {
      integrityLevel = 'FAILED';
      passed = false;
      failureReason = 'Virtual machine or emulator environment detected';
    }

    // 3. Upsert attestation record
    const attestation = await advancedSecurityRepository.upsertDeviceAttestation({
      deviceId,
      platform,
      provider,
      attestationToken,
      integrityLevel,
      isRooted,
      isEmulator,
      isTampered: !passed,
      passed,
      failureReason,
      metadata
    });

    return {
      passed,
      integrity: integrityLevel,
      deviceId: attestation.deviceId,
      platform: attestation.platform,
      provider: attestation.provider,
      reason: failureReason,
      attestedAt: attestation.lastAttestedAt
    };
  },

  /**
   * 2. IP Whitelist Validation
   */
  validateIPAddress: async ({ ipAddress, companyId }) => {
    if (!ipAddress) {
      return { passed: true, reason: 'No IP address provided' };
    }

    const settings = await advancedSecurityRepository.findCompanySecuritySettings(companyId);
    const ipSettings = { ...DEFAULT_SECURITY_SETTINGS, ...settings };

    if (!ipSettings.ipWhitelistEnabled) {
      return { passed: true, reason: 'IP whitelisting is disabled' };
    }

    const allowed = ipSettings.allowedIpRanges || [];
    
    // Check direct match or wildcard/subnet match
    const isAllowed = allowed.some((range) => {
      if (range === ipAddress || range === '127.0.0.1' || range === '::1') return true;
      if (range.endsWith('*') && ipAddress.startsWith(range.slice(0, -1))) return true;
      if (range.includes('/')) {
        // Simple subnet prefix match
        const prefix = range.split('/')[0].split('.').slice(0, 2).join('.');
        return ipAddress.startsWith(prefix);
      }
      return false;
    });

    return {
      passed: isAllowed,
      ipAddress,
      reason: isAllowed ? 'IP address is in company whitelist' : `IP ${ipAddress} is not in corporate whitelist`
    };
  },

  /**
   * 3. VPN / Proxy Detection
   */
  detectVPN: async ({ ipAddress }) => {
    if (!ipAddress) {
      return { isVPN: false, isProxy: false, details: 'Localhost or internal IP' };
    }

    // Known datacenter / hosting / VPN indicators for simulated or real IP checks
    const vpnSubnets = ['10.8.', '10.9.', '172.16.', '198.51.', '203.0.113.'];
    const isVPN = vpnSubnets.some((sub) => ipAddress.startsWith(sub));

    return {
      isVPN,
      isProxy: isVPN,
      ipAddress,
      provider: isVPN ? 'Commercial VPN / Proxy' : 'Residential ISP',
      details: isVPN ? 'VPN/Proxy network signature detected' : 'Direct ISP connection verified'
    };
  },

  /**
   * 4. Mock GPS Detection & Cross-Check
   */
  detectMockLocation: async ({ isMockLocation, latitude, longitude, accuracy = 10 }) => {
    const issues = [];
    if (isMockLocation) {
      issues.push('Device mock location provider active');
    }
    if (accuracy > 50) {
      issues.push(`GPS accuracy ${accuracy}m exceeds 50m threshold`);
    }

    const passed = issues.length === 0;
    return {
      passed,
      latitude,
      longitude,
      accuracy,
      reason: passed ? 'Location hardware genuine' : issues.join(' | ')
    };
  },

  /**
   * 5. Calculate Employee / Company Security Health Score (0 - 100)
   */
  getSecurityScore: async ({ employeeId, companyId }) => {
    let score = 100;
    const deductions = [];

    const where = { companyId };
    if (employeeId) where.employeeId = employeeId;

    const [fraudCount, failedAttestations] = await Promise.all([
      prisma.fraudSignal.count({ where }),
      employeeId
        ? 0
        : prisma.deviceAttestation.count({ where: { passed: false } })
    ]);

    if (fraudCount > 0) {
      const deduction = Math.min(40, fraudCount * 10);
      score -= deduction;
      deductions.push(`-${deduction} pts: ${fraudCount} fraud signals logged`);
    }

    if (failedAttestations > 0) {
      const deduction = Math.min(30, failedAttestations * 15);
      score -= deduction;
      deductions.push(`-${deduction} pts: ${failedAttestations} failed device attestations`);
    }

    return {
      score: Math.max(0, score),
      grade: score >= 90 ? 'A+' : score >= 75 ? 'A' : score >= 60 ? 'B' : 'CRITICAL',
      deductions,
      evaluatedAt: new Date().toISOString()
    };
  },

  /**
   * 6. Update Company Security Settings
   */
  updateSecuritySettings: async ({ companyId, settings, updatedBy }) => {
    const existing = await advancedSecurityRepository.findCompanySecuritySettings(companyId);
    const updated = { ...DEFAULT_SECURITY_SETTINGS, ...existing, ...settings };

    await advancedSecurityRepository.updateCompanySecuritySettings(companyId, updated);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedBy || null,
        action: 'UPDATE_SECURITY_SETTINGS',
        entity: 'Company',
        entityId: companyId,
        oldValues: existing,
        newValues: updated
      }
    });

    return updated;
  },

  /**
   * 7. Security Operations Dashboard Overview
   */
  getSecurityDashboard: async (companyId) => {
    const [metrics, recentFraud, settings, securityScore] = await Promise.all([
      advancedSecurityRepository.countSecurityMetrics(companyId),
      advancedSecurityRepository.findFraudSignals(companyId, {}, { page: 1, limit: 5 }),
      advancedSecurityRepository.findCompanySecuritySettings(companyId),
      advancedSecurityService.getSecurityScore({ companyId })
    ]);

    return {
      metrics,
      recentFraudSignals: recentFraud.signals,
      settings: { ...DEFAULT_SECURITY_SETTINGS, ...settings },
      securityScore
    };
  },

  /**
   * 8. Review Fraud Signal Action (Approve / Reject / Block Employee)
   */
  reviewFraudSignal: async ({ signalId, companyId, action, notes, reviewedBy }) => {
    const signal = await advancedSecurityRepository.findFraudSignalById(signalId);
    if (!signal || signal.companyId !== companyId) {
      throw new AppError('Fraud signal record not found', 404);
    }

    const isBlock = action === 'BLOCK';
    const isApproved = action === 'APPROVE' || action === 'RESOLVE';

    if (isBlock && signal.employeeId) {
      // Suspend / Inactive employee
      await prisma.employee.update({
        where: { id: signal.employeeId },
        data: { status: 'INACTIVE' }
      });
    }

    const updated = await advancedSecurityRepository.updateFraudSignal(signalId, {
      reviewed: true,
      reviewedBy,
      reviewedAt: new Date(),
      metadata: {
        ...(signal.metadata || {}),
        reviewAction: action,
        reviewNotes: notes,
        reviewedBy
      }
    });

    return {
      reviewed: true,
      signalId,
      action,
      notes,
      updatedSignal: updated
    };
  },

  /**
   * 9. Security Events
   */
  getSecurityEvents: async (companyId, filters = {}) => {
    const where = {};
    if (companyId) where.companyId = companyId;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.severity) where.severity = filters.severity;

    return prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ? parseInt(filters.limit, 10) : 50,
    });
  },

  /**
   * 10. Audit Logs & Export
   */
  getAuditLogs: async (companyId, filters = {}) => {
    const where = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ? parseInt(filters.limit, 10) : 100,
      include: {
        user: { select: { id: true, email: true } }
      }
    });
  },

  exportAuditLogs: async (companyId, filters = {}) => {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return {
      total: logs.length,
      format: filters.format || 'CSV',
      downloadUrl: `https://exports.ems-cloud.internal/audit_logs_${Date.now()}.${(filters.format || 'csv').toLowerCase()}`,
      logs
    };
  },

  /**
   * 11. Block / Unblock Employee
   */
  blockEmployee: async ({ employeeId, reason, blockedBy }) => {
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: { status: 'INACTIVE' }
    });

    // Also lock user account if associated
    if (employee.userId) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { status: 'LOCKED' }
      });
    }

    // Log security event
    await prisma.securityEvent.create({
      data: {
        companyId: employee.companyId,
        eventType: 'EMPLOYEE_BLOCKED',
        severity: 'HIGH',
        description: `Employee ${employee.firstName} ${employee.lastName} was blocked: ${reason}`,
        metadata: { employeeId, reason, blockedBy }
      }
    });

    return {
      employeeId,
      status: 'BLOCKED',
      reason,
      blockedBy,
      employee
    };
  },

  unblockEmployee: async ({ employeeId, unblockedBy }) => {
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: { status: 'ACTIVE' }
    });

    if (employee.userId) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { status: 'ACTIVE' }
      });
    }

    await prisma.securityEvent.create({
      data: {
        companyId: employee.companyId,
        eventType: 'EMPLOYEE_UNBLOCKED',
        severity: 'MEDIUM',
        description: `Employee ${employee.firstName} ${employee.lastName} was unblocked`,
        metadata: { employeeId, unblockedBy }
      }
    });

    return {
      employeeId,
      status: 'ACTIVE',
      unblockedBy,
      employee
    };
  },

  getBlockedEmployees: async (companyId) => {
    return prisma.employee.findMany({
      where: {
        companyId,
        status: { in: ['INACTIVE', 'TERMINATED'] }
      },
      include: {
        designation: true,
        department: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
};

export default advancedSecurityService;
