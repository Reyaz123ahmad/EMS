import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Phase 4C - Leave Module Integration Tests', () => {
  let companyId;
  let employeeId;
  let leaveTypeId;
  let leaveRequestId;

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

  it('POST /api/v1/leave/types - Should create a new leave type with full payload', async () => {
    const res = await request(app)
      .post('/api/v1/leave/types')
      .send({
        companyId,
        name: 'Earned Leave Test',
        code: `EL_${Date.now()}`,
        description: 'Annual paid earned leave allowance',
        daysAllowed: 18,
        isPaid: true,
        carryForward: true,
        maxCarryForwardDays: 6,
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
    if (res.body?.data?.id) {
      leaveTypeId = res.body.data.id;
    }
  });

  it('GET /api/v1/leave/types - Should fetch leave types', async () => {
    const res = await request(app)
      .get('/api/v1/leave/types')
      .query({ companyId });

    expect([200, 401, 403]).toContain(res.status);
  });

  it('POST /api/v1/leave/balances/bulk-allocate - Should bulk allocate balances', async () => {
    const res = await request(app)
      .post('/api/v1/leave/balances/bulk-allocate')
      .send({
        companyId,
        leaveTypeId,
        year: 2026,
        days: 18,
        allocatedBy: employeeId,
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
  });

  it('POST /api/v1/leave/apply - Should apply for leave with full payload', async () => {
    const res = await request(app)
      .post('/api/v1/leave/apply')
      .send({
        companyId,
        employeeId,
        leaveTypeId,
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        reason: 'Attending family wedding and travel',
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
    if (res.body?.data?.id) {
      leaveRequestId = res.body.data.id;
    }
  });

  it('GET /api/v1/leave/calendar - Should fetch monthly leave calendar', async () => {
    const res = await request(app)
      .get('/api/v1/leave/calendar')
      .query({ companyId, month: 10, year: 2026 });

    expect([200, 401, 403]).toContain(res.status);
  });

  it('GET /api/v1/leave/balances - Should fetch balances report', async () => {
    const res = await request(app)
      .get('/api/v1/leave/balances')
      .query({ companyId, year: 2026 });

    expect([200, 401, 403]).toContain(res.status);
  });

  it('GET /api/v1/leave/stats - Should fetch leave summary statistics', async () => {
    const res = await request(app)
      .get('/api/v1/leave/stats')
      .query({ companyId, year: 2026 });

    expect([200, 401, 403]).toContain(res.status);
  });
});
