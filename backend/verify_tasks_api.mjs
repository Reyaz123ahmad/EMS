import { prisma } from './src/config/prisma.js';
import { generateAccessToken } from './src/security/jwt.js';
import fetch from 'node-fetch';

async function test() {
  const adminUser = await prisma.user.findFirst({
    where: { userRoles: { some: { role: { name: 'COMPANY_ADMIN' } } } },
    include: { 
      company: true,
      userRoles: { include: { role: true } }
    }
  });
  if (!adminUser) {
    console.error('No admin user found');
    return;
  }
  const token = generateAccessToken({
    id: adminUser.id,
    email: adminUser.email,
    companyId: adminUser.companyId,
    role: 'COMPANY_ADMIN'
  });

  const projects = await prisma.project.findMany({
    where: { companyId: adminUser.companyId }
  });

  console.log(`--- Testing ${projects.length} Projects for company ${adminUser.companyId} ---`);
  for (const p of projects) {
    // 1. Fetch tasks
    const getRes = await fetch(`http://localhost:5000/api/v1/projects/${p.id}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getData = await getRes.json();
    console.log(`[BEFORE] Project "${p.name}" (ID: ${p.id}) -> HTTP ${getRes.status}, Tasks: ${getData.data?.length ?? 0}`);

    // 2. Create a test task for this project
    const createRes = await fetch(`http://localhost:5000/api/v1/projects/${p.id}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: `Agile Deliverable ${Date.now()}`,
        description: 'Auto-verified project task created via API',
        priority: 'HIGH',
        status: 'TODO'
      })
    });
    const createData = await createRes.json();
    console.log(`[CREATE TASK] HTTP ${createRes.status}, Created Task ID: ${createData.data?.id}`);

    // 3. Fetch again
    const verifyRes = await fetch(`http://localhost:5000/api/v1/projects/${p.id}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const verifyData = await verifyRes.json();
    console.log(`[AFTER] Project "${p.name}" (ID: ${p.id}) -> HTTP ${verifyRes.status}, Tasks: ${verifyData.data?.length ?? 0}`);
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
