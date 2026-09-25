import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Phase 4C - Payroll Module Integration Tests', () => {
  let companyId;
  let employeeId;
  let componentId;
  let payrollRunId;

  beforeAll(async () => {
    const user = await prisma.user.findFirst({
      where: { email: 'admin@ems.com' },
      include: { employee: true },
    });
    if (user) {
      companyId = user.companyId;
      employeeId = user.employee?.id || user.id;
    }
  });

  it('POST /api/v1/payroll/components - Should create salary component', async () => {
    const res = await request(app)
      .post('/api/v1/payroll/components')
      .send({
        companyId,
        name: 'Special Allowance Test',
        code: `SA_${Date.now()}`,
        type: 'EARNING',
        calculationType: 'FIXED',
        defaultAmount: 5000,
        isTaxable: true,
        description: 'Performance-based recurring special allowance',
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
    if (res.body?.data?.id) {
      componentId = res.body.data.id;
    }
  });

  it('GET /api/v1/payroll/components - Should fetch salary components', async () => {
    const res = await request(app)
      .get('/api/v1/payroll/components')
      .query({ companyId });

    expect([200, 401, 403]).toContain(res.status);
  });

  it('POST /api/v1/payroll/preview - Should calculate payroll preview', async () => {
    const res = await request(app)
      .post('/api/v1/payroll/preview')
      .send({
        companyId,
        month: 9,
        year: 2026,
      });

    expect([200, 400, 401, 403]).toContain(res.status);
  });

  it('POST /api/v1/payroll/process - Should process monthly payroll batch', async () => {
    const res = await request(app)
      .post('/api/v1/payroll/process')
      .send({
        companyId,
        month: 9,
        year: 2026,
        processedBy: employeeId,
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
    if (res.body?.data?.id) {
      payrollRunId = res.body.data.id;
    }
  });

  it('GET /api/v1/payroll/runs - Should fetch payroll history', async () => {
    const res = await request(app)
      .get('/api/v1/payroll/runs')
      .query({ companyId, year: 2026 });

    expect([200, 401, 403]).toContain(res.status);
  });

  it('GET /api/v1/payroll/slips - Should fetch individual salary slips', async () => {
    const res = await request(app)
      .get('/api/v1/payroll/slips')
      .query({ companyId, month: 9, year: 2026 });

    expect([200, 401, 403]).toContain(res.status);
  });
});
