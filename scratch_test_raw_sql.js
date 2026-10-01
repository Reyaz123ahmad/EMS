import { prisma } from './backend/src/config/prisma.js';

async function test() {
  const t0 = Date.now();
  const companyId = '29ba6047-ac9b-4520-8b49-67d041da9325';
  const emps = await prisma.$queryRaw`
    SELECT e.id, e."employeeCode", e."firstName", e."lastName", e.email, e.phone, e.status, e."employmentType", e."joiningDate", e."createdAt",
           d.id as "department_id", d.name as "department_name",
           des.id as "designation_id", des.name as "designation_name",
           b.id as "branch_id", b.name as "branch_name"
    FROM employees e
    LEFT JOIN departments d ON e."departmentId" = d.id
    LEFT JOIN designations des ON e."designationId" = des.id
    LEFT JOIN branches b ON e."branchId" = b.id
    WHERE e."companyId" = ${companyId}
    ORDER BY e."createdAt" DESC
    LIMIT 10 OFFSET 0;
  `;
  console.log('Raw SQL query took:', Date.now() - t0, 'ms. Retrieved:', emps.length);
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
