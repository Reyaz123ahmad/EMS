import prisma from '../src/config/prisma.js';
import { employeesService } from '../src/modules/employees/employees.service.js';

async function testSpeed() {
  // Warm up DB connection
  const admin = await prisma.user.findFirst({
    where: { email: 'reyazahmad40544@gmail.com' },
    include: { company: true, userRoles: { include: { role: true } } }
  });

  const adminRoles = admin.userRoles?.map(ur => ur.role.name) || ['COMPANY_ADMIN'];

  const testEmail = `speedtest_${Date.now()}@example.com`;
  console.log('Testing sendEmployeeOTP speed...');
  const startTime = Date.now();

  const res = await employeesService.sendEmployeeOTP({
    employeeData: {
      firstName: 'Speed',
      lastName: 'Test',
      email: testEmail,
      phone: '9661440544',
      employmentType: 'FULL_TIME',
      role: 'EMPLOYEE'
    },
    companyId: admin.companyId,
    reqUser: {
      ...admin,
      role: adminRoles[0] || 'COMPANY_ADMIN',
      roles: adminRoles
    }
  });

  const durationMs = Date.now() - startTime;
  console.log(`\n========================================`);
  console.log(`API sendEmployeeOTP execution time: ${durationMs} ms`);
  console.log(`Session ID:`, res.sessionId);
  console.log(`Result Message:`, res.message);
  console.log(`========================================\n`);

  if (durationMs < 2000) {
    console.log(`TEST PASSED: Execution time is ${durationMs}ms (< 2000ms target).`);
  } else {
    console.log(`TEST FAILED: Too slow (${durationMs}ms).`);
  }

  // Allow fire-and-forget background operations a second
  await new Promise(r => setTimeout(r, 1000));
  process.exit(0);
}

testSpeed().catch(err => {
  console.error('Error in testSpeed:', err);
  process.exit(1);
});
