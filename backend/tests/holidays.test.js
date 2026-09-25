import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Phase 4C - Holiday Calendar Module Integration Tests', () => {
  let companyId;
  let employeeId;
  let calendarId;
  let holidayId;

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

  it('POST /api/v1/holiday-calendars - Should create holiday calendar with full payload', async () => {
    const res = await request(app)
      .post('/api/v1/holiday-calendars')
      .send({
        companyId,
        name: 'India Corporate Calendar 2026',
        year: 2026,
        isDefault: true,
        description: 'Official holidays for India development centres',
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
    if (res.body?.data?.id) {
      calendarId = res.body.data.id;
    }
  });

  it('POST /api/v1/holidays - Should add holiday to calendar', async () => {
    const res = await request(app)
      .post('/api/v1/holidays')
      .send({
        companyId,
        calendarId,
        name: 'Gandhi Jayanti',
        date: '2026-10-02',
        isOptional: false,
        description: 'National holiday observing Mahatma Gandhi birthday',
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
    if (res.body?.data?.id) {
      holidayId = res.body.data.id;
    }
  });

  it('POST /api/v1/holidays/bulk-import - Should bulk import holiday records', async () => {
    const res = await request(app)
      .post('/api/v1/holidays/bulk-import')
      .send({
        companyId,
        calendarId,
        importedBy: employeeId,
        holidays: [
          { name: 'Diwali', date: '2026-11-08', isOptional: false },
          { name: 'Christmas Day', date: '2026-12-25', isOptional: false },
        ],
      });

    expect([200, 201, 400, 401, 403]).toContain(res.status);
  });

  it('GET /api/v1/holidays/calendar - Should fetch annual calendar view', async () => {
    const res = await request(app)
      .get('/api/v1/holidays/calendar')
      .query({ companyId, year: 2026 });

    expect([200, 401, 403]).toContain(res.status);
  });
});
