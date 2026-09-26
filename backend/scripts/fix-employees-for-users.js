import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixEmployeesForUsers() {
  console.log('Starting employee record creation for users without employee...\n');

  // Find users without employee record who belong to a company
  const users = await prisma.user.findMany({
    where: {
      employee: null,
      companyId: { not: null }
    },
    include: {
      company: true,
      userRoles: { include: { role: true } }
    }
  });

  console.log(`Found ${users.length} users without employee record\n`);

  let fixed = 0;

  for (const user of users) {
    console.log(`Processing: ${user.email} (Company: ${user.company?.name || user.companyId})`);

    // Get user's name from email or default
    const nameParts = (user.email.split('@')[0] || 'User').split('.');
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'User';
    const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : '';

    // Generate unique employee code
    const count = await prisma.employee.count({
      where: { companyId: user.companyId }
    });
    const employeeCode = `${user.company?.companyCode || 'EMP'}-${String(count + 1).padStart(4, '0')}`;

    // Create employee record
    const employee = await prisma.employee.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        employeeCode,
        firstName,
        lastName,
        email: user.email,
        phone: user.phone,
        joiningDate: new Date(),
        employmentType: 'FULL_TIME',
        status: 'ACTIVE'
      }
    });

    console.log(`  ✓ Employee created: ${employeeCode} for User ID ${user.id}\n`);
    fixed++;
  }

  console.log('========================================');
  console.log(`Total users without employee: ${users.length}`);
  console.log(`Fixed: ${fixed}`);
  console.log('========================================\n');
}

fixEmployeesForUsers()
  .then(async () => {
    console.log('Migration completed successfully!');
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
