const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { resolveShiftForEmployee } = require('./src/modules/shifts/services/resolveShift.service');

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'reyazahmad40544@gmail.com' },
    include: {
      employee: {
        include: {
          shiftAssignments: {
            include: { shift: true }
          },
          rosters: {
            include: { shift: true }
          }
        }
      }
    }
  });

  console.log('USER:', user?.email, user?.role);
  console.log('EMPLOYEE ID:', user?.employee?.id);
  console.log('EMPLOYEE NAME:', user?.employee?.firstName, user?.employee?.lastName);
  console.log('EMPLOYEE CODE:', user?.employee?.employeeCode);
  console.log('SHIFT ASSIGNMENTS:', JSON.stringify(user?.employee?.shiftAssignments, null, 2));
  console.log('ROSTERS:', JSON.stringify(user?.employee?.rosters, null, 2));

  if (user?.employee) {
    const resolved = await resolveShiftForEmployee({
      employeeId: user.employee.id,
      companyId: user.companyId,
      date: new Date()
    });
    console.log('RESOLVED SHIFT FOR AMIT BHAI (resolveShiftForEmployee):', JSON.stringify(resolved, null, 2));
  }

  if (user?.companyId) {
    const shifts = await prisma.shift.findMany({
      where: { companyId: user.companyId }
    });
    console.log('ALL COMPANY SHIFTS:', JSON.stringify(shifts, null, 2));
  }

  // Also check attendance_logs for Amit Bhai today
  if (user?.employee) {
    const logs = await prisma.attendanceLog.findMany({
      where: { employeeId: user.employee.id },
      orderBy: { attendanceDate: 'desc' },
      take: 5
    });
    console.log('ATTENDANCE LOGS FOR AMIT BHAI:', JSON.stringify(logs, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
