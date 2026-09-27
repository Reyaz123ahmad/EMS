import axios from 'axios';

const creds = [
  { role: 'COMPANY_ADMIN', email: 'reyazahmad40544@gmail.com', pass: 'Temp@e68a02e6!' },
  { role: 'HR_ADMIN', email: 'hr.admin.test@mindstocs.com', pass: 'Test@123456' },
  { role: 'HR_MANAGER', email: 'hr.manager.test@mindstocs.com', pass: 'Test@123456' },
  { role: 'MANAGER', email: 'manager.test@mindstocs.com', pass: 'Test@123456' },
  { role: 'EMPLOYEE', email: 'employee.test@mindstocs.com', pass: 'Test@123456' },
  { role: 'CLIENT', email: 'client.test@mindstocs.com', pass: 'Test@123456' }
];

async function testAll() {
  console.log('Testing authentication for all 6 target company accounts...');
  for (const c of creds) {
    try {
      const res = await axios.post('http://localhost:5000/api/v1/auth/login', {
        email: c.email,
        password: c.pass
      });
      const u = res.data.data.user;
      console.log(`[PASS] ${c.role}: ${u.email} (Role: ${u.role}, Co: ${u.companyId})`);
    } catch (e) {
      console.error(`[FAIL] ${c.role} (${c.email}):`, e.response?.status, e.response?.data || e.message);
    }
  }
}

testAll();
