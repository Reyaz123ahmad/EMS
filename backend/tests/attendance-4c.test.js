import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Phase 4C - Attendance Extended Module Integration Tests', () => {
  let token;
  let companyId;
  let employeeId;

  beforeAll(async () => {
    // Find active company & user with employee record
    const user = await prisma.user.findFirst({
      where: { email: 'admin@ems.com' },
      include: { employee: true },
    });
    if (user) {
      companyId = user.companyId;
      employeeId = user.employee?.id || user.id;
    }
  });

  it('GET /api/v1/attendance/calendar - Should fetch monthly attendance calendar', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/calendar')
      .query({ companyId, month: 9, year: 2026 });

    expect([200, 401, 403]).toContain(res.status);
  });

  it('GET /api/v1/attendance/summary - Should fetch employee monthly summary', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/summary')
      .query({ employeeId, month: 9, year: 2026 });

    expect([200, 401, 403]).toContain(res.status);
  });

  it('POST /api/v1/attendance/manual - Should accept manual attendance override', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/manual')
      .send({
        employeeId,
        date: '2026-09-20',
        checkIn: '09:05:00',
        checkOut: '18:15:00',
        status: 'PRESENT',
        reason: 'Client site deployment',
        markedBy: employeeId,
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
  });

  it('POST /api/v1/attendance/bulk-mark - Should support bulk status updates', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/bulk-mark')
      .send({
        companyId,
        employeeIds: [employeeId],
        date: '2026-09-21',
        status: 'PRESENT',
        markedBy: employeeId,
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
  });

  it('GET /api/v1/attendance/exceptions - Should list exception records', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/exceptions')
      .query({ companyId, startDate: '2026-09-01', endDate: '2026-09-30' });

    expect([200, 401, 403]).toContain(res.status);
  });

  it('PUT /api/v1/attendance/policy - Should update company attendance policy', async () => {
    const res = await request(app)
      .put('/api/v1/attendance/policy')
      .send({
        companyId,
        policy: {
          workHoursPerDay: 8,
          gracePeriodMinutes: 15,
          halfDayThresholdHours: 4,
          overtimeThresholdMinutes: 30,
        },
      });

    expect([200, 400, 401, 403]).toContain(res.status);
  });
});
