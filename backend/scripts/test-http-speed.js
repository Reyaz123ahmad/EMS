import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';

async function testHttpSpeed() {
  const admin = await prisma.user.findFirst({
    where: { email: 'reyazahmad40544@gmail.com' },
    include: { company: true, userRoles: { include: { role: true } } }
  });

  if (!admin) {
    throw new Error('Admin not found');
  }

  const adminRoles = admin.userRoles?.map(ur => ur.role.name) || ['COMPANY_ADMIN'];
  const token = generateAccessToken({
    id: admin.id,
    email: admin.email,
    role: adminRoles[0] || 'COMPANY_ADMIN',
    roles: adminRoles,
    companyId: admin.companyId
  });

  const uniqueEmail = `emp_speed_${Date.now()}@gmail.com`;
  console.log('Sending OTP request via HTTP...');
  const t0 = Date.now();

  const res = await fetch('http://127.0.0.1:5000/api/v1/employees/send-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      employeeData: {
        firstName: 'Speed',
        lastName: 'Test',
        email: uniqueEmail,
        phone: '9661440544',
        employmentType: 'FULL_TIME',
        role: 'EMPLOYEE'
      }
    })
  });

  const elapsed = Date.now() - t0;
  const data = await res.json();

  console.log('\n========================================');
  console.log('HTTP Status:', res.status);
  console.log('API Response Time:', `${elapsed} ms`);
  console.log('Response Body:', data);
  console.log('========================================\n');

  if (elapsed < 3000 && res.status === 200) {
    console.log(`✅ TEST PASSED: Response returned in ${elapsed}ms (< 3 seconds)`);
  } else {
    console.log(`❌ TEST FAILED: Status ${res.status}, Elapsed ${elapsed}ms`);
  }

  process.exit(0);
}

testHttpSpeed().catch(err => {
  console.error('Error in testHttpSpeed:', err);
  process.exit(1);
});
