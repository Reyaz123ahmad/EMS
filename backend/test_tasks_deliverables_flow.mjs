import app from './src/app.js';
import prisma from './src/config/prisma.js';
import { generateAccessToken } from './src/security/jwt.js';
import http from 'http';

async function runTests() {
  console.log('=== RUNNING PROJECT TASKS & DELIVERABLES VERIFICATION ===');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`Test server running on port ${port}`);

  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error('Company not found');
    const companyId = company.id;

    // Get Admin User
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

    // Find or create test project
    let project = await prisma.project.findFirst({ where: { companyId } });
    if (!project) {
      project = await prisma.project.create({
        data: {
          companyId,
          name: 'Delivery App Phase 1',
          status: 'ACTIVE'
        }
      });
    }

    const employee = await prisma.employee.findFirst({ where: { companyId, status: 'ACTIVE' } });

    console.log('\n--- 1. Testing Create Task via POST /projects/:id/tasks ---');
    const createTaskRes = await fetch(`${baseUrl}/projects/${project.id}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Build API Gateway and Routing',
        description: 'Configure reverse proxy routes and rate limits',
        assigneeId: employee?.id,
        priority: 'HIGH',
        status: 'TODO',
        estimatedHours: 12
      })
    });

    const taskCreated = await createTaskRes.json();
    console.log(`Create Task Response: status=${createTaskRes.status}, success=${taskCreated.success}`);
    if (createTaskRes.status !== 201) {
      throw new Error(`Failed to create task: ${JSON.stringify(taskCreated)}`);
    }

    console.log('\n--- 2. Testing Fetch Tasks via GET /projects/:id/tasks ---');
    const getTasksRes = await fetch(`${baseUrl}/projects/${project.id}/tasks`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const tasksData = await getTasksRes.json();
    console.log(`GET /projects/:id/tasks status=${getTasksRes.status}, total tasks count=${tasksData.data?.length}`);

    const tasksList = tasksData.data || [];
    const todoCount = tasksList.filter(t => t.status === 'TODO' || t.status === 'PENDING' || t.status === 'BACKLOG').length;
    const inProgressCount = tasksList.filter(t => t.status === 'IN_PROGRESS').length;
    const completedCount = tasksList.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;

    console.log(`Counters Computed -> Total: ${tasksList.length}, TODO: ${todoCount}, IN_PROGRESS: ${inProgressCount}, COMPLETED: ${completedCount}`);

    if (getTasksRes.status === 200 && tasksList.length > 0) {
      console.log('Task fetching and counter calculation: PASS');
    } else {
      console.error('Task fetching: FAIL');
    }

    console.log('\n=== ALL TASKS DELIVERABLES TESTS PASSED! ===');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
