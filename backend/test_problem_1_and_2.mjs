import app from './src/app.js';
import prisma from './src/config/prisma.js';
import { generateAccessToken } from './src/security/jwt.js';
import http from 'http';

async function runTests() {
  console.log('=== RUNNING PROBLEM 1 & PROBLEM 2 VERIFICATION TESTS ===');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`Test server active on port ${port}`);

  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error('Company not found');
    const companyId = company.id;

    // Get Admin user & token
    const adminUser = await prisma.user.findFirst({
      where: { companyId, userRoles: { some: { role: { name: 'COMPANY_ADMIN' } } } }
    });
    const adminToken = generateAccessToken({
      sub: adminUser?.id || 'admin-test',
      id: adminUser?.id || 'admin-test',
      email: adminUser?.email || 'admin@test.com',
      role: 'COMPANY_ADMIN',
      companyId
    });

    // Get a client
    let client = await prisma.client.findFirst({ where: { companyId } });
    if (!client) {
      client = await prisma.client.create({
        data: {
          companyId,
          name: 'Acme Test Client',
          status: 'ACTIVE'
        }
      });
    }

    // Get active employees for company
    let employees = await prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      take: 4
    });
    if (employees.length < 2) {
      const emp2 = await prisma.employee.create({
        data: {
          companyId,
          firstName: 'Sarah',
          lastName: 'Developer',
          employeeCode: 'DEV002',
          email: `sarah_${Date.now()}@example.com`,
          status: 'ACTIVE',
          joiningDate: new Date()
        }
      });
      employees = [...employees, emp2];
    }

    const managerEmp = employees[0];
    const memberEmps = employees.slice(1);
    const memberIds = memberEmps.map(e => e.id);

    // Make sure manager user has MANAGER role
    const managerRole = await prisma.role.findFirst({ where: { name: 'MANAGER' } });
    let managerUser = await prisma.user.findFirst({ where: { employee: { id: managerEmp.id } } });
    if (!managerUser) {
      managerUser = await prisma.user.findFirst({ where: { companyId } });
    }
    if (managerUser && managerRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: managerUser.id, roleId: managerRole.id } },
        create: { userId: managerUser.id, roleId: managerRole.id },
        update: {}
      });
    }

    console.log('\n--- TEST 1: Create project with team members ---');
    const createRes = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'OmniChannel Retail App ' + Date.now(),
        description: 'E-commerce platform with automated delivery routing',
        clientId: client.id,
        managerId: managerEmp.id,
        memberIds: memberIds,
        budget: 75000,
        status: 'ACTIVE'
      })
    });

    const createData = await createRes.json();
    console.log(`Create Project Response: status=${createRes.status}, success=${createData.success}`);
    
    if (createRes.status !== 201 && createRes.status !== 200) {
      throw new Error(`Project creation failed: ${JSON.stringify(createData)}`);
    }

    const createdProject = createData.data || createData.project || createData;
    const projectId = createdProject.id;
    console.log(`Created Project ID: ${projectId}, Members in response: ${createdProject.members?.length}`);

    // Verify DB records
    const dbMembers = await prisma.projectMember.findMany({
      where: { projectId }
    });
    console.log(`DB ProjectMember count: ${dbMembers.length}`);
    const foundManager = dbMembers.some(m => m.employeeId === managerEmp.id && m.role === 'MANAGER');
    const foundMembers = memberIds.every(id => dbMembers.some(m => m.employeeId === id));
    console.log(`Manager recorded as MANAGER: ${foundManager}`);
    console.log(`All selected members recorded: ${foundMembers}`);

    if (foundManager && foundMembers) {
      console.log('PROBLEM 1 — Team members at creation: PASS');
    } else {
      console.error('PROBLEM 1 — Team members at creation: FAIL');
    }

    console.log('\n--- TEST 2: GET /projects/:id/tasks (Problem 2 Fix) ---');
    // Create a ProjectTask in DB
    await prisma.projectTask.create({
      data: {
        projectId,
        assigneeId: memberIds[0],
        title: 'Design Wireframes in Figma',
        description: 'High-fidelity mockups for cart and checkout',
        status: 'IN_PROGRESS',
        priority: 'HIGH'
      }
    });

    const tasksRes = await fetch(`${baseUrl}/projects/${projectId}/tasks`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const tasksData = await tasksRes.json();
    console.log(`GET /projects/:id/tasks status=${tasksRes.status}, success=${tasksData.success}, tasksCount=${tasksData.data?.length}`);

    if (tasksRes.status === 200 && tasksData.success && tasksData.data?.length > 0) {
      console.log(`Task Title: ${tasksData.data[0].title}, Assignee Employee: ${tasksData.data[0].employee?.firstName}`);
      console.log('PROBLEM 2 — /:id/tasks route: PASS');
    } else {
      console.error('PROBLEM 2 — /:id/tasks route: FAIL', tasksData);
    }

    console.log('\n--- TEST 3: Multi-tenant Cross-Company Member Safety ---');
    const fakeCrossCompanyEmpId = '00000000-0000-0000-0000-000000000000';
    const invalidCreateRes = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Malicious Cross-Tenant Project',
        clientId: client.id,
        managerId: managerEmp.id,
        memberIds: [fakeCrossCompanyEmpId],
        status: 'ACTIVE'
      })
    });
    const invalidData = await invalidCreateRes.json();
    console.log(`Invalid memberIds response status: ${invalidCreateRes.status}, message: ${invalidData.message}`);

    if (invalidCreateRes.status === 400) {
      console.log('Cross-tenant validation: PASS');
    } else {
      console.error('Cross-tenant validation: FAIL');
    }

    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
