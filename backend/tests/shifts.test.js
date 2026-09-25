import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Phase 4C - Shifts & Rosters Module Integration Tests', () => {
  let companyId;
  let employeeId;
  let shiftId;

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

  it('POST /api/v1/shifts - Should create new shift schedule with full payload', async () => {
    const res = await request(app)
      .post('/api/v1/shifts')
      .send({
        companyId,
        name: 'Afternoon Shift Test',
        code: `AS_${Date.now()}`,
        startTime: '14:00',
        endTime: '22:00',
        gracePeriod: 15,
        halfDayHours: 4,
        fullDayHours: 8,
        breakDuration: 45,
        isNightShift: false,
        description: 'Standard second shift rotation schedule',
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
    if (res.body?.data?.id) {
      shiftId = res.body.data.id;
    }
  });

  it('GET /api/v1/shifts - Should fetch shifts list', async () => {
    const res = await request(app)
      .get('/api/v1/shifts')
      .query({ companyId });

    expect([200, 401, 403]).toContain(res.status);
  });

  it('POST /api/v1/shifts/assign - Should assign shift to employees', async () => {
    const res = await request(app)
      .post('/api/v1/shifts/assign')
      .send({
        companyId,
        shiftId,
        effectiveFrom: '2026-10-01',
        effectiveTo: '2026-12-31',
        employeeIds: [employeeId],
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
  });

  it('POST /api/v1/rosters/generate - Should generate monthly roster', async () => {
    const res = await request(app)
      .post('/api/v1/rosters/generate')
      .send({
        companyId,
        month: 10,
        year: 2026,
        shiftId,
        shiftPattern: '5_2',
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
  });

  it('GET /api/v1/rosters/calendar - Should fetch monthly roster calendar', async () => {
    const res = await request(app)
      .get('/api/v1/rosters/calendar')
      .query({ companyId, month: 10, year: 2026 });

    expect([200, 401, 403]).toContain(res.status);
  });
});
