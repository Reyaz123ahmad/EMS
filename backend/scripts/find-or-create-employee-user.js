import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function setupTestEmployee() {
  const companyId = '925af98c-24d1-4f9f-8f87-97a55734c7cd';
  const email = 'emp.test@mindstocs.com';
  const password = 'Temp@e68a02e6!';

  // Find or create employee user
  let user = await prisma.user.findUnique({
    where: { email },
    include: { employee: true }
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!user) {
    // Check employee role
    let empRole = await prisma.role.findFirst({ where: { name: 'EMPLOYEE' } });
    if (!empRole) {
      empRole = await prisma.role.create({
        data: { name: 'EMPLOYEE', description: 'Employee role' }
      });
    }

    user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        company: { connect: { id: companyId } },
        status: 'ACTIVE',
        userRoles: {
          create: {
            roleId: empRole.id,
            companyId
          }
        }
      }
    });

    const empCount = await prisma.employee.count({ where: { companyId } });
    await prisma.employee.create({
      data: {
        companyId,
        userId: user.id,
        employeeCode: `EMP-${String(empCount + 1).padStart(4, '0')}`,
        firstName: 'Employee',
        lastName: 'Tester',
        email,
        joiningDate: new Date(),
        employmentType: 'FULL_TIME',
        status: 'ACTIVE'
      }
    });

    console.log(`Created test employee: ${email}`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword, status: 'ACTIVE' }
    });
    console.log(`Updated test employee password: ${email}`);
  }

  process.exit(0);
}

setupTestEmployee().catch(err => {
  console.error(err);
  process.exit(1);
});
