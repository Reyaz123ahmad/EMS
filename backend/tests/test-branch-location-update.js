import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';

async function testBranchUpdate() {
  console.log('=== TEST BRANCH LIVE LOCATION UPDATE ===\n');

  const branchId = 'f74c6719-d57a-4237-9a61-85fa9e9c7dc7';
  const companyId = '925af98c-24d1-4f9f-8f87-97a55734c7cd';

  // 1. Get company admin
  const user = await prisma.user.findFirst({
    where: { companyId },
    include: { userRoles: { include: { role: true } } }
  });

  if (!user) {
    console.error('No user found for company:', companyId);
    return;
  }

  const role = user.userRoles[0]?.role?.name || 'COMPANY_ADMIN';
  console.log(`Found user ${user.email} with role ${role}`);

  // 2. Generate token
  const token = generateAccessToken({
    id: user.id,
    email: user.email,
    companyId: user.companyId,
    role: role
  });

  // Example live coordinates (e.g., standard GPS test location or Motihari / user location)
  // Let's test the endpoint via HTTP fetch to the backend server
  const testLocation = {
    latitude: 26.6469854,
    longitude: 84.9088741,
    address: 'Auto-filled from live location',
    city: 'Auto-detected',
    state: 'Auto-detected'
  };

  console.log('\nSending PUT /api/v1/branches/' + branchId);
  console.log('Payload:', testLocation);

  const res = await fetch(`http://localhost:5000/api/v1/branches/${branchId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(testLocation)
  });

  const data = await res.json();
  console.log('\nResponse status:', res.status);
  console.log('Response body:', JSON.stringify(data, null, 2));

  // 3. Verify in DB
  const updated = await prisma.branch.findUnique({
    where: { id: branchId }
  });

  console.log('\nDB Record after update:');
  console.log({
    id: updated.id,
    name: updated.name,
    latitude: updated.latitude,
    longitude: updated.longitude,
    address: updated.address,
    city: updated.city,
    state: updated.state,
    updatedAt: updated.updatedAt
  });

  await prisma.$disconnect();
}

testBranchUpdate().catch(console.error);
