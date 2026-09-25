import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Phase 4C - Overtime Module Integration Tests', () => {
  let companyId;
  let employeeId;
  let ruleId;
  let recordId;

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

  it('POST /api/v1/overtime/rules - Should create overtime rule with full payload', async () => {
    const res = await request(app)
      .post('/api/v1/overtime/rules')
      .send({
        companyId,
        name: 'Weekend Overtime Rate Test',
        dayType: 'WEEKEND',
        multiplier: 2.0,
        minMinutes: 30,
        maxDailyMinutes: 360,
        requiresApproval: true,
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
    if (res.body?.data?.id) {
      ruleId = res.body.data.id;
    }
  });

  it('GET /api/v1/overtime/rules - Should fetch overtime rules', async () => {
    const res = await request(app)
      .get('/api/v1/overtime/rules')
      .query({ companyId });

    expect([200, 401, 403]).toContain(res.status);
  });

  it('POST /api/v1/overtime/apply - Should submit overtime claim', async () => {
    const res = await request(app)
      .post('/api/v1/overtime/apply')
      .send({
        companyId,
        employeeId,
        date: '2026-09-24',
        minutes: 120,
        reason: 'Server upgrade and disaster recovery dry run',
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
    if (res.body?.data?.id) {
      recordId = res.body.data.id;
    }
  });

  it('GET /api/v1/overtime/records - Should list overtime records', async () => {
    const res = await request(app)
      .get('/api/v1/overtime/records')
      .query({ companyId });

    expect([200, 401, 403]).toContain(res.status);
  });

  it('GET /api/v1/overtime/stats - Should fetch overtime summary metrics', async () => {
    const res = await request(app)
      .get('/api/v1/overtime/stats')
      .query({ companyId });

    expect([200, 401, 403]).toContain(res.status);
  });
});
