import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/config/prisma.js', () => {
  const mockPrisma = {
    subscription: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'sub-1', status: 'ACTIVE' }),
      count: vi.fn().mockResolvedValue(10)
    },
    subscriptionPlan: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue({ id: 'plan-1', name: 'Pro' })
    },
    invoice: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({ id: 'inv-1', amount: 1000 }),
      count: vi.fn().mockResolvedValue(0)
    },
    paymentTransaction: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0)
    },
    securityEvent: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(5)
    },
    fraudSignal: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0)
    },
    auditLog: {
      count: vi.fn().mockResolvedValue(12)
    },
    employee: {
      count: vi.fn().mockResolvedValue(0)
    },
    company: {
      count: vi.fn().mockResolvedValue(8),
      findMany: vi.fn().mockResolvedValue([])
    },
    user: {
      count: vi.fn().mockResolvedValue(25),
      findMany: vi.fn().mockResolvedValue([])
    }
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

import * as subscriptionService from '../src/modules/subscriptions/subscriptions.service.js';
import * as invoiceService from '../src/modules/invoices/invoices.service.js';
import * as paymentService from '../src/modules/payments/payments.service.js';
import * as securityService from '../src/modules/advanced-security/advanced-security.service.js';
import { requireCompany } from '../src/middlewares/tenant.middleware.js';
import { errorHandler } from '../src/middlewares/error.middleware.js';
import { successResponse, errorResponse, forbiddenResponse } from '../src/utils/response.js';

describe('Super Admin Isolation & Error Handling Test Suite', () => {
  describe('1. Super Admin Subscription Bypass', () => {
    it('should return platform admin status without requiring a subscription when companyId is null', async () => {
      const result = await subscriptionService.getCurrentSubscription(null);
      expect(result).toBeDefined();
      expect(result.isPlatformAdmin).toBe(true);
      expect(result.message).toContain('Platform Super Admin does not require a subscription');
      expect(result.subscription).toBeNull();
      expect(result.invoices).toEqual([]);
      expect(result.payments).toEqual([]);
    });
  });

  describe('2. Invoice Retrieval with Null companyId', () => {
    it('should handle listInvoices gracefully for platform admin when companyId is null', async () => {
      const result = await invoiceService.listInvoices(null);
      expect(result).toBeDefined();
      expect(result.invoices).toBeInstanceOf(Array);
      expect(result.page).toBe(1);
    });

    it('should handle listPayments gracefully for platform admin when companyId is null', async () => {
      const result = await paymentService.listPayments(null);
      expect(result).toBeDefined();
      expect(result.payments).toBeInstanceOf(Array);
      expect(result.page).toBe(1);
    });
  });

  describe('3. Advanced Security Dashboard for Platform Super Admin', () => {
    it('should return global aggregated overview when companyId is null', async () => {
      const result = await securityService.getSecurityDashboard(null);
      expect(result).toBeDefined();
      expect(result.isPlatformAdmin).toBe(true);
      expect(result.overview).toBeDefined();
      expect(typeof result.overview.securityScore).toBe('number');
      expect(Array.isArray(result.recentEvents)).toBe(true);
    });

    it('should return fraud signals list when companyId is null without crashing', async () => {
      const result = await securityService.getFraudSignals(null, { limit: 10 });
      expect(result).toBeDefined();
      expect(Array.isArray(result.signals)).toBe(true);
      expect(typeof result.total).toBe('number');
    });
  });

  describe('4. Tenant Isolation Middleware (requireCompany)', () => {
    it('should return 403 PLATFORM_ADMIN_NOT_ALLOWED when req.user.companyId is null', () => {
      const req = { user: { role: 'SUPER_ADMIN', companyId: null } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
      const next = vi.fn();

      requireCompany(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        code: 'PLATFORM_ADMIN_NOT_ALLOWED',
        message: expect.stringContaining('Platform Super Admin cannot access this')
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() when req.user.companyId is present', () => {
      const req = { user: { role: 'COMPANY_ADMIN', companyId: 'comp-123' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
      const next = vi.fn();

      requireCompany(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('5. Clean Error Handling Middleware', () => {
    it('should format Prisma P2002 duplicate record error cleanly without leaking internals', () => {
      const err = new Error('Unique constraint failed on the fields: (`email`)');
      err.code = 'P2002';
      const req = { url: '/api/v1/users', method: 'POST', user: null };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This record already exists'
      });
    });

    it('should format Prisma P2025 record not found error cleanly', () => {
      const err = new Error('Record to update not found.');
      err.code = 'P2025';
      const req = { url: '/api/v1/employees/123', method: 'GET', user: null };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Record not found'
      });
    });

    it('should format JWT TokenExpiredError cleanly', () => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      const req = { url: '/api/v1/attendance', method: 'GET', user: null };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session expired. Please login again.'
      });
    });

    it('should format standard custom error without leaking stack traces', () => {
      const err = new Error('Custom validation failed');
      err.statusCode = 422;
      err.code = 'CUSTOM_ERROR';
      const req = { url: '/api/v1/test', method: 'POST', user: null };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Custom validation failed',
        code: 'CUSTOM_ERROR'
      });
    });
  });

  describe('6. Response Utility Helpers', () => {
    it('should format standard successResponse correctly', () => {
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };
      const data = { id: 1, name: 'Test Tenant' };

      successResponse(res, data, 'Tenant retrieved', 200);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tenant retrieved',
        data
      });
    });

    it('should format standard errorResponse correctly', () => {
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      };

      errorResponse(res, 'Invalid request parameters', 400, 'BAD_REQUEST');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid request parameters',
        code: 'BAD_REQUEST'
      });
    });
  });
});
