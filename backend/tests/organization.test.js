import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

export async function runOrganizationTests(companyId) {
  console.log('\n--- [3/5] STARTING ORGANIZATION MODULE TEST SUITE ---');

  let adminUser = await prisma.user.findFirst({
    where: { companyId, status: 'ACTIVE' },
    include: { userRoles: { include: { role: true } } }
  });

  if (!adminUser) {
    adminUser = await prisma.user.findFirst({
      where: { status: 'ACTIVE' }
    });
  }

  const effectiveCompanyId = companyId || adminUser.companyId;

  const token = generateAccessToken({
    id: adminUser.id,
    sub: adminUser.id,
    userId: adminUser.id,
    email: adminUser.email,
    role: 'COMPANY_ADMIN',
    companyId: effectiveCompanyId
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const suffix = Date.now();

  // 1. Branches CRUD & Stats
  console.log('1. Testing POST & GET /api/v1/branches (Branches CRUD)...');
  const branchPayload = {
    name: `HQ Innovation Hub ${suffix}`,
    code: `HQ-${suffix.toString().slice(-3)}`,
    address: '100 Silicon Way',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    latitude: 37.7749,
    longitude: -122.4194,
    radiusMeters: 150
  };

  const createBranchRes = await fetch(`${BASE_URL}/branches`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(branchPayload)
  });
  const createBranchData = await createBranchRes.json();
  console.log('Create Branch Status:', createBranchRes.status, 'ID:', createBranchData.data?.branch?.id);
  if (createBranchRes.status !== 201 || !createBranchData.data?.branch?.id) {
    throw new Error(`Create Branch failed: ${JSON.stringify(createBranchData)}`);
  }

  const branchId = createBranchData.data.branch.id;

  const branchStatsRes = await fetch(`${BASE_URL}/branches/stats`, { headers: authHeaders });
  const branchStatsData = await branchStatsRes.json();
  console.log('Branch Stats Status:', branchStatsRes.status, 'Total Branches:', branchStatsData.data?.totalBranches);

  // 2. Departments CRUD & Stats
  console.log('2. Testing POST & GET /api/v1/departments (Departments CRUD)...');
  const deptPayload = {
    name: `Artificial Intelligence & Cloud ${suffix}`,
    code: `AIC-${suffix.toString().slice(-3)}`,
    description: 'Autonomous agents and cloud backend infrastructure engineering'
  };

  const createDeptRes = await fetch(`${BASE_URL}/departments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(deptPayload)
  });
  const createDeptData = await createDeptRes.json();
  console.log('Create Department Status:', createDeptRes.status, 'ID:', createDeptData.data?.department?.id);
  if (createDeptRes.status !== 201 || !createDeptData.data?.department?.id) {
    throw new Error(`Create Department failed: ${JSON.stringify(createDeptData)}`);
  }

  const deptId = createDeptData.data.department.id;

  const deptStatsRes = await fetch(`${BASE_URL}/departments/stats`, { headers: authHeaders });
  const deptStatsData = await deptStatsRes.json();
  console.log('Department Stats Status:', deptStatsRes.status, 'Total Depts:', deptStatsData.data?.totalDepartments);

  // 3. Designations CRUD & Stats
  console.log('3. Testing POST & GET /api/v1/designations (Designations CRUD)...');
  const desigPayload = {
    name: `Staff Distributed Systems Engineer ${suffix}`,
    code: `SDSE-${suffix.toString().slice(-3)}`,
    description: 'High-throughput microservices architecture and zero-trust security',
    level: 4
  };

  const createDesigRes = await fetch(`${BASE_URL}/designations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(desigPayload)
  });
  const createDesigData = await createDesigRes.json();
  console.log('Create Designation Status:', createDesigRes.status, 'ID:', createDesigData.data?.designation?.id);
  if (createDesigRes.status !== 201 || !createDesigData.data?.designation?.id) {
    throw new Error(`Create Designation failed: ${JSON.stringify(createDesigData)}`);
  }

  const desigId = createDesigData.data.designation.id;

  const desigStatsRes = await fetch(`${BASE_URL}/designations/stats`, { headers: authHeaders });
  const desigStatsData = await desigStatsRes.json();
  console.log('Designation Stats Status:', desigStatsRes.status, 'Total Designations:', desigStatsData.data?.totalDesignations);

  console.log('✅ ALL ORGANIZATION MODULE TESTS PASSED');
  return { branchId, deptId, desigId };
}

export default runOrganizationTests;
