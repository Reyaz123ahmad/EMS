import prisma from './backend/src/config/prisma.js';

async function testFastDashboard() {
  const companyId = '29ba6047-ac9b-4520-8b49-67d041da9325';
  const t0 = performance.now();

  try {
    const [metrics] = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*)::int FROM employees WHERE "companyId" = ${companyId}) as "totalEmployees",
        (SELECT COUNT(*)::int FROM employees WHERE "companyId" = ${companyId} AND "status" = 'ACTIVE') as "activeEmployees",
        (SELECT COUNT(*)::int FROM branches WHERE "companyId" = ${companyId}) as "totalBranches",
        (SELECT COUNT(*)::int FROM departments WHERE "companyId" = ${companyId}) as "totalDepartments",
        (SELECT COUNT(*)::int FROM leave_requests WHERE "status" = 'APPROVED' AND "startDate" <= NOW() AND "endDate" >= NOW() AND "employeeId" IN (SELECT id FROM employees WHERE "companyId" = ${companyId})) as "onLeaveToday",
        (SELECT COALESCE(SUM(budget), 0)::float FROM projects WHERE "companyId" = ${companyId}) as "totalBudget"
    `;

    const ms = performance.now() - t0;
    console.log('Single Query Result:', metrics, `(${Math.round(ms)}ms)`);
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testFastDashboard().catch(console.error);
