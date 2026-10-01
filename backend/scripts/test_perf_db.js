import prisma from '../src/config/prisma.js';
import { performance } from 'perf_hooks';

async function testQuery() {
  const cleanEmail = 'benchmark.employee@mindstocs.com';
  
  // Warm up connection
  await prisma.$queryRaw`SELECT 1`;

  for (let i = 1; i <= 3; i++) {
    const start1 = performance.now();
    await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        status: true,
        twoFactorEnabled: true,
        phone: true,
        companyId: true,
        company: { select: { id: true, name: true, domain: true, logoUrl: true, companyCode: true, status: true } },
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, departmentId: true, designationId: true, branchId: true, status: true } },
        userRoles: { select: { role: { select: { id: true, name: true, displayName: true } } } }
      }
    });
    console.log(`Prisma warm run ${i}:`, Math.round(performance.now() - start1), 'ms');
  }

  for (let i = 1; i <= 3; i++) {
    const start2 = performance.now();
    await prisma.$queryRaw`
      SELECT 
        u.id, u.email, u."passwordHash", u.status, u."twoFactorEnabled", u.phone, u."companyId",
        c.name as "companyName", c.domain as "companyDomain", c."logoUrl" as "companyLogoUrl", c."companyCode" as "companyCode", c.status as "companyStatus",
        e.id as "employeeId", e."firstName", e."lastName", e."employeeCode", e."departmentId", e."designationId", e."branchId", e.status as "employeeStatus",
        r.name as "roleName", r."displayName" as "roleDisplayName"
      FROM users u
      LEFT JOIN companies c ON u."companyId" = c.id
      LEFT JOIN employees e ON u.id = e."userId"
      LEFT JOIN user_roles ur ON u.id = ur."userId"
      LEFT JOIN roles r ON ur."roleId" = r.id
      WHERE LOWER(u.email) = ${cleanEmail}
      LIMIT 1
    `;
    console.log(`Raw SQL warm run ${i}:`, Math.round(performance.now() - start2), 'ms');
  }

  process.exit(0);
}
testQuery();
