import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

export async function runReportTests(companyId) {
  console.log('\n--- [5/5] STARTING REPORTS MODULE TEST SUITE ---');

  let adminUser = await prisma.user.findFirst({
    where: { companyId, status: 'ACTIVE' },
    include: { userRoles: { include: { role: true } } }
  });

  if (!adminUser) {
    adminUser = await prisma.user.findFirst({
      where: { status: 'ACTIVE' }
    });
  }

  const effectiveCompanyId = companyId || adminUser.companyId;

  const token = generateAccessToken({
    id: adminUser.id,
    sub: adminUser.id,
    userId: adminUser.id,
    email: adminUser.email,
    role: 'COMPANY_ADMIN',
    companyId: effectiveCompanyId
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const reportTypes = ['ATTENDANCE', 'EMPLOYEE', 'LEAVE', 'PAYROLL', 'OVERTIME', 'PERFORMANCE', 'PROJECT', 'CLIENT'];

  // 1. Generate Report (All Types)
  console.log('1. Testing POST /api/v1/reports/generate (Testing all 8 Report Types with Full Payload)...');
  for (const type of reportTypes) {
    const genRes = await fetch(`${BASE_URL}/reports/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type,
        filters: {
          startDate: '2026-01-01',
          endDate: '2026-12-31'
        }
      })
    });
    const genData = await genRes.json();
    console.log(`  -> Generate ${type} Status:`, genRes.status, 'Total Rows:', genData.data?.totalRecords);
    if (genRes.status !== 200 || genData.status !== 'ok') {
      throw new Error(`Generate ${type} failed: ${JSON.stringify(genData)}`);
    }
  }

  // 2. Export Report (CSV, Excel, PDF)
  console.log('2. Testing POST /api/v1/reports/export (CSV, Excel, PDF Formats)...');
  const formats = ['CSV', 'EXCEL', 'PDF'];
  for (const format of formats) {
    const expRes = await fetch(`${BASE_URL}/reports/export`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'ATTENDANCE',
        format,
        filters: {
          startDate: '2026-01-01',
          endDate: '2026-12-31'
        }
      })
    });
    const expData = await expRes.json();
    console.log(`  -> Export ${format} Status:`, expRes.status, 'File URL:', expData.data?.fileUrl);
    if (expRes.status !== 200 || !expData.data?.fileUrl) {
      throw new Error(`Export ${format} failed: ${JSON.stringify(expData)}`);
    }
  }

  // 3. Report Stats
  console.log('3. Testing GET /api/v1/reports/stats...');
  const statsRes = await fetch(`${BASE_URL}/reports/stats`, { headers: authHeaders });
  const statsData = await statsRes.json();
  console.log('Report Stats Status:', statsRes.status, 'Stats:', statsData.data);
  if (statsRes.status !== 200) {
    throw new Error(`Report stats failed: ${JSON.stringify(statsData)}`);
  }

  // 4. Report History
  console.log('4. Testing GET /api/v1/reports/history...');
  const historyRes = await fetch(`${BASE_URL}/reports/history`, { headers: authHeaders });
  const historyData = await historyRes.json();
  console.log('Report History Status:', historyRes.status, 'Count:', historyData.data?.histories?.length);
  if (historyRes.status !== 200) {
    throw new Error(`Report history failed: ${JSON.stringify(historyData)}`);
  }

  console.log('✅ ALL REPORTS MODULE TESTS PASSED');
}

export default runReportTests;
