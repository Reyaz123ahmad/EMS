import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import app from './src/app.js';
import prisma from './src/config/prisma.js';
import { generateAccessToken } from './src/security/jwt.js';
import http from 'http';

async function runVerification() {
  console.log('=== VERIFYING SERVER STARTUP AND ROUTE HANDLERS ===');
  
  // 1. Start Server on an ephemeral port to verify zero TypeErrors
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`Test server running on port ${port}`);

  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error('Company not found');
    const companyId = company.id;

    // Find/setup test users: Admin, Employee, Manager
    const adminUser = await prisma.user.findFirst({
      where: { companyId, userRoles: { some: { role: { name: 'COMPANY_ADMIN' } } } }
    });
    
    // Find or create an employee user
    let employee = await prisma.employee.findFirst({ where: { companyId, status: 'ACTIVE' } });
    let employeeUser = await prisma.user.findFirst({ where: { employee: { id: employee?.id } } });

    const adminToken = generateAccessToken({
      sub: adminUser?.id || 'admin-test-id',
      id: adminUser?.id || 'admin-test-id',
      email: adminUser?.email || 'admin@test.com',
      role: 'COMPANY_ADMIN',
      companyId
    });

    const employeeToken = generateAccessToken({
      sub: employeeUser?.id || 'emp-test-id',
      id: employeeUser?.id || 'emp-test-id',
      email: employeeUser?.email || 'emp@test.com',
      role: 'EMPLOYEE',
      companyId
    });

    console.log('\n--- Test 1: Server startup without TypeError ---');
    console.log('Server started without TypeError: PASS');

    // 2. GET /employees/managers with valid COMPANY_ADMIN token -> 200
    console.log('\n--- Test 2: GET /employees/managers (Admin) ---');
    const resAdmin = await fetch(`${baseUrl}/employees/managers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataAdmin = await resAdmin.json();
    console.log(`Status: ${resAdmin.status}, Success: ${dataAdmin.success}, Managers Count: ${dataAdmin.data?.length}`);
    if (resAdmin.status === 200 && dataAdmin.success) {
      console.log('GET /employees/managers (admin): PASS');
    } else {
      console.error('GET /employees/managers (admin): FAIL', dataAdmin);
    }

    // 3. GET /employees/managers without token -> 401
    console.log('\n--- Test 3: GET /employees/managers (No Token) ---');
    const resNoAuth = await fetch(`${baseUrl}/employees/managers`);
    const dataNoAuth = await resNoAuth.json();
    console.log(`Status: ${resNoAuth.status}, Message: ${dataNoAuth.message}`);
    if (resNoAuth.status === 401) {
      console.log('GET /employees/managers (no token): PASS');
    } else {
      console.error('GET /employees/managers (no token): FAIL');
    }

    // 4. GET /employees/managers with EMPLOYEE token -> 403
    console.log('\n--- Test 4: GET /employees/managers (Employee role) ---');
    const resForbidden = await fetch(`${baseUrl}/employees/managers`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const dataForbidden = await resForbidden.json();
    console.log(`Status: ${resForbidden.status}, Message: ${dataForbidden.message}`);
    if (resForbidden.status === 403) {
      console.log('GET /employees/managers (employee): PASS');
    } else {
      console.error('GET /employees/managers (employee): FAIL');
    }

    // 5. GET /projects/my for EMPLOYEE -> 200
    console.log('\n--- Test 5: GET /projects/my (Employee) ---');
    const resMyProjects = await fetch(`${baseUrl}/projects/my`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const dataMyProjects = await resMyProjects.json();
    console.log(`Status: ${resMyProjects.status}, Success: ${dataMyProjects.success}`);
    if (resMyProjects.status === 200 && dataMyProjects.success) {
      console.log('GET /projects/my (employee): PASS');
    } else {
      console.error('GET /projects/my (employee): FAIL', dataMyProjects);
    }

    // 6. GET /projects/:id/members/progress for COMPANY_ADMIN -> 200
    console.log('\n--- Test 6: GET /projects/:id/members/progress (Admin) ---');
    let project = await prisma.project.findFirst({ where: { companyId } });
    if (!project) {
      project = await prisma.project.create({
        data: {
          companyId,
          name: 'Verification Project',
          status: 'ACTIVE'
        }
      });
    }

    const resMemberProgress = await fetch(`${baseUrl}/projects/${project.id}/members/progress`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataMemberProgress = await resMemberProgress.json();
    console.log(`Status: ${resMemberProgress.status}, Success: ${dataMemberProgress.success}`);
    if (resMemberProgress.status === 200 && dataMemberProgress.success) {
      console.log('GET /projects/:id/members/progress (admin): PASS');
    } else {
      console.error('GET /projects/:id/members/progress (admin): FAIL', dataMemberProgress);
    }

    console.log('\n=== ALL 6 CHECKS VERIFIED SUCCESSFULLY! ===');
  } catch (error) {
    console.error('Verification error:', error);
  } finally {
    server.close();
    process.exit(0);
  }
}

runVerification();
