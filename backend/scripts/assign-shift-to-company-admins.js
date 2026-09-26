import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function assignShiftToCompanyAdmins() {
  console.log('Starting shift assignment for Company Admins only...\n');

  // Get all Company Admins
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
      company: true,
      shiftAssignments: {
        where: {
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } }
          ]
        }
      }
    }
  });

  console.log(`Found ${companyAdmins.length} Company Admin(s)\n`);

  let totalFixed = 0;
  let totalSkipped = 0;

  for (const admin of companyAdmins) {
    console.log(`Processing: ${admin.firstName} ${admin.lastName} (${admin.user?.email})`);

    // Check if admin already has a shift
    if (admin.shiftAssignments.length > 0) {
      console.log(`  ✓ Already has shift, skipping\n`);
      totalSkipped++;
      continue;
    }

    // Get company's default shift (General Shift)
    let defaultShift = await prisma.shift.findFirst({
      where: {
        companyId: admin.companyId,
        name: 'General Shift',
        isActive: true
      }
    });

    // If no General Shift, create one
    if (!defaultShift) {
      console.log('  → Creating default shift...');
      defaultShift = await prisma.shift.create({
        data: {
          companyId: admin.companyId,
          name: 'General Shift',
          startTime: '09:00',
          endTime: '18:00',
          graceMinutes: 15,
          isNightShift: false,
          workingHours: 8,
          isActive: true
        }
      });
      console.log(`  ✓ Default shift created`);
    } else {
      console.log(`  ✓ Found existing shift: ${defaultShift.name}`);
    }

    // Assign shift to Company Admin
    console.log(`  → Assigning shift to ${admin.firstName}...`);
    await prisma.shiftAssignment.create({
      data: {
        employeeId: admin.id,
        shiftId: defaultShift.id,
        effectiveFrom: new Date(),
        effectiveTo: null
      }
    });

    // Create leave balances for admin (if not exists)
    const currentYear = new Date().getFullYear();
    const leaveTypes = await prisma.leaveType.findMany({
      where: { companyId: admin.companyId }
    });

    for (const lt of leaveTypes) {
      const existingBalance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: admin.id,
          leaveTypeId: lt.id,
          year: currentYear
        }
      });

      if (!existingBalance) {
        await prisma.leaveBalance.create({
          data: {
            employeeId: admin.id,
            leaveTypeId: lt.id,
            year: currentYear,
            totalDays: lt.maxDaysPerYear || 0,
            usedDays: 0,
            remainingDays: lt.maxDaysPerYear || 0
          }
        });
      }
    }

    console.log(`  ✓ Shift assigned to ${admin.firstName} ${admin.lastName}\n`);
    totalFixed++;
  }

  console.log('========================================');
  console.log(`Total Company Admins: ${companyAdmins.length}`);
  console.log(`Fixed: ${totalFixed}`);
  console.log(`Skipped (already had shift): ${totalSkipped}`);
  console.log('========================================\n');
}

assignShiftToCompanyAdmins()
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
