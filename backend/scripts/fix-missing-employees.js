import { prisma } from '../src/config/prisma.js';

async function fixMissingEmployees() {
  console.log('Finding users without employee records...\n');

  const users = await prisma.user.findMany({
    where: {
      companyId: { not: null },
      employee: null
    },
    include: {
      company: true,
      userRoles: { include: { role: true } }
    }
  });

  console.log(`Found ${users.length} users without employee record\n`);

  let fixed = 0;

  for (const user of users) {
    console.log(`Processing: ${user.email} (Company: ${user.companyId})`);

    const count = await prisma.employee.count({
      where: { companyId: user.companyId }
    });
    const employeeCode = `EMP-${String(count + 1).padStart(4, '0')}`;

    const nameParts = (user.email.split('@')[0] || 'User').split('.');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts[1] || '';

    await prisma.employee.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        employeeCode,
        firstName,
        lastName,
        email: user.email,
        phone: user.phone || null,
        joiningDate: new Date(),
        employmentType: 'FULL_TIME',
        status: 'ACTIVE'
      }
    });

    console.log(`  ✓ Employee created: ${employeeCode} for ${user.email}`);
    fixed++;
  }

  console.log(`\nTotal fixed: ${fixed}`);
  process.exit(0);
}

fixMissingEmployees().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
