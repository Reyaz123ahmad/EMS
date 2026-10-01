import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';
import { encryptData } from '../src/security/encryption.js';

async function setup() {
  console.log('Setting up benchmark test user and employee...');

  // 1. Get or create company
  let company = await prisma.company.findFirst({
    where: { status: 'ACTIVE' }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Benchmark Enterprise Corp',
        domain: 'benchmark.corp',
        email: 'admin@benchmark.corp',
        status: 'ACTIVE'
      }
    });
  }

  // 2. Get or create branch
  let branch = await prisma.branch.findFirst({
    where: { companyId: company.id }
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        companyId: company.id,
        name: 'Headquarters',
        code: 'HQ01',
        latitude: 28.6139,
        longitude: 77.2090,
        geofenceRadius: 5000,
        isGeofenceActive: true
      }
    });
  }

  // 3. Get or create test user
  const email = 'benchmark.employee@mindstocs.com';
  const password = 'Password@123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        status: 'ACTIVE',
        companyId: company.id,
        twoFactorEnabled: false
      }
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, status: 'ACTIVE', companyId: company.id }
    });
  }

  // 4. Role
  let role = await prisma.role.findFirst({
    where: { name: 'EMPLOYEE', companyId: company.id }
  });
  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'EMPLOYEE',
        displayName: 'Employee',
        companyId: company.id,
        description: 'Standard Employee'
      }
    });
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id
    }
  });

  // 5. Mock 128-dim face vector
  const mockVector = new Array(128).fill(0).map((_, i) => Math.sin(i) * 0.1);
  const encryptedVector = encryptData(mockVector);

  // 6. Employee profile
  let employee = await prisma.employee.findFirst({
    where: { userId: user.id }
  });

  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        userId: user.id,
        employeeCode: 'EMP-BENCH-01',
        firstName: 'Benchmark',
        lastName: 'Tester',
        email: user.email,
        status: 'ACTIVE',
        employmentType: 'FULL_TIME',
        joiningDate: new Date(),
        faceEmbedding: encryptedVector,
        faceRegisteredAt: new Date()
      }
    });
  } else {
    employee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        branchId: branch.id,
        faceEmbedding: encryptedVector,
        faceRegisteredAt: new Date()
      }
    });
  }

  // 7. Card assignment
  const existingCard = await prisma.employeeCard.findFirst({
    where: { cardNumber: 'CARD-BENCH-001' }
  });

  if (!existingCard) {
    await prisma.employeeCard.create({
      data: {
        cardNumber: 'CARD-BENCH-001',
        cardType: 'RFID',
        companyId: company.id,
        employeeId: employee.id,
        isActive: true,
        assignedAt: new Date()
      }
    });
  } else {
    await prisma.employeeCard.update({
      where: { id: existingCard.id },
      data: { employeeId: employee.id, isActive: true, companyId: company.id }
    });
  }

  console.log('✅ Benchmark test user ready:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Employee ID: ${employee.id}`);
  console.log(`Branch: ${branch.name} (${branch.latitude}, ${branch.longitude})`);
  console.log(`Card Number: CARD-BENCH-001`);

  await prisma.$disconnect();
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
