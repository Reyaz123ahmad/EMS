import { prisma } from './src/config/prisma.js';
import { generateAccessToken } from './src/security/jwt.js';
import fetch from 'node-fetch';

async function test() {
  const adminUser = await prisma.user.findFirst({
    where: { userRoles: { some: { role: { name: 'COMPANY_ADMIN' } } } },
    include: { company: true }
  });
  if (!adminUser) {
    console.error('No admin found');
    return;
  }
  const token = generateAccessToken({
    id: adminUser.id,
    email: adminUser.email,
    companyId: adminUser.companyId,
    role: 'COMPANY_ADMIN'
  });

  const project = await prisma.project.findFirst({
    where: { companyId: adminUser.companyId }
  });

  if (!project) {
    console.error('No project found for company');
    return;
  }

  console.log(`Testing with project "${project.name}" (ID: ${project.id})`);

  // Test 1: POST /projects/:id/tasks (Project-scoped creation)
  const res1 = await fetch(`http://localhost:5000/api/v1/projects/${project.id}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Project Route Task ' + Date.now(),
      description: 'Created via /projects/:id/tasks',
      priority: 'HIGH',
      status: 'TODO'
    })
  });
  const data1 = await res1.json();
  console.log(`[TEST 1 - POST /projects/:id/tasks]: Status ${res1.status}, Task ID: ${data1.data?.id}`);

  // Test 2: POST /tasks with projectId (Global tasks creation)
  const res2 = await fetch(`http://localhost:5000/api/v1/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      projectId: project.id,
      title: 'Global Route Project Task ' + Date.now(),
      description: 'Created via /tasks with projectId',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS'
    })
  });
  const data2 = await res2.json();
  console.log(`[TEST 2 - POST /tasks with projectId]: Status ${res2.status}, Task ID: ${data2.data?.id}`);

  // Test 3: Backend validation - POST /tasks with invalid projectId
  const res3 = await fetch(`http://localhost:5000/api/v1/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      projectId: '00000000-0000-0000-0000-000000000000',
      title: 'Invalid Task',
      status: 'TODO'
    })
  });
  console.log(`[TEST 3 - Invalid Project Validation]: Status ${res3.status} (Expected 404)`);

  // Test 4: Verify in database
  const latestTask = await prisma.projectTask.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
    include: { project: true }
  });
  console.log(`[TEST 4 - DB Check]: Latest Task "${latestTask?.title}" -> Linked to Project "${latestTask?.project?.name}" (ID: ${latestTask?.projectId})`);
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
