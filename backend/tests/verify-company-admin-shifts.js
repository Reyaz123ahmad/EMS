import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { generateAccessToken } from '../src/security/jwt.js';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';

async function verify() {
  console.log('=== VERIFYING COMPANY ADMIN SHIFT ASSIGNMENTS ===\n');

  // 1. Check all Company Admins in database
  const companyAdmins = await prisma.employee.findMany({
    where: {
      user: {
        userRoles: {
          some: {
            role: { name: 'COMPANY_ADMIN' }
          }
        }
      }
    },
    include: {
      user: true,
      shiftAssignments: {
        where: {
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } }
          ]
        },
        include: { shift: true }
      }
    }
  });

  console.log(`Total Company Admins checked: ${companyAdmins.length}`);

  let adminsWithShift = 0;
  for (const admin of companyAdmins) {
    if (admin.shiftAssignments.length > 0) {
      adminsWithShift++;
    } else {
      console.error(`❌ Admin without shift: ${admin.firstName} ${admin.lastName} (${admin.user?.email})`);
    }
  }

  const allAdminsHaveShift = (adminsWithShift === companyAdmins.length);
  console.log(`Admins with active shift: ${adminsWithShift}/${companyAdmins.length} (${allAdminsHaveShift ? 'PASS' : 'FAIL'})`);

  // 2. Test /shifts/my-shift API for a Company Admin
  const sampleAdmin = companyAdmins[0];
  let apiPass = false;
  if (sampleAdmin) {
    const token = generateAccessToken({
      id: sampleAdmin.userId,
      email: sampleAdmin.user.email,
      role: 'COMPANY_ADMIN',
      companyId: sampleAdmin.companyId
    });

    try {
      const res = await axios.get(`${API_URL}/shifts/my-shift`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const shiftData = res.data?.data;
      if (shiftData && shiftData.shift && shiftData.shift.name) {
        console.log(`✅ GET /shifts/my-shift returned: "${shiftData.shift.name}" (${shiftData.shift.startTime} - ${shiftData.shift.endTime})`);
        apiPass = true;
      } else {
        console.error('❌ /shifts/my-shift returned unexpected payload:', res.data);
      }
    } catch (e) {
      console.error('❌ GET /shifts/my-shift failed:', e.response?.data?.message || e.message);
    }
  }

  console.log('\n========================================');
  console.log(`TEST RESULTS:`);
  console.log(`Company Admin has shift: ${allAdminsHaveShift ? 'PASS' : 'FAIL'}`);
  console.log(`Can query /my-shift: ${apiPass ? 'PASS' : 'FAIL'}`);
  console.log('========================================\n');

  await prisma.$disconnect();
  process.exit(allAdminsHaveShift && apiPass ? 0 : 1);
}

verify().catch(async (err) => {
  console.error('Fatal verification error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
