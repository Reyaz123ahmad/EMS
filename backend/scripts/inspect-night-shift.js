import prisma from '../src/config/prisma.js';

async function main() {
  console.log('--- Inspecting User & Employee for ejazahmad96614@gmail.com ---');
  const user = await prisma.user.findFirst({
    where: { email: { equals: 'ejazahmad96614@gmail.com', mode: 'insensitive' } },
    include: {
      employee: {
        include: {
          shiftAssignments: {
            include: { shift: true },
            orderBy: { effectiveFrom: 'desc' }
          },
          company: true
        }
      }
    }
  });

  if (!user) {
    console.log('User not found!');
    // Let's search all users
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, status: true, employee: { select: { id: true, firstName: true, lastName: true } } }
    });
    console.log('All Users:', allUsers);
    return;
  }

  console.log('User:', { id: user.id, email: user.email, status: user.status, companyId: user.companyId });
  console.log('Employee:', {
    id: user.employee?.id,
    name: `${user.employee?.firstName} ${user.employee?.lastName}`,
    companyId: user.employee?.companyId
  });
  console.log('Shift Assignments:', user.employee?.shiftAssignments);

  if (user.employee) {
    const logs = await prisma.attendanceLog.findMany({
      where: { employeeId: user.employee.id },
      orderBy: { attendanceDate: 'desc' },
      take: 20
    });
    console.log('\n--- Attendance Logs for Employee (count: ' + logs.length + ') ---');
    console.log(logs);

    // Let's also check all attendance logs in the company
    const companyLogs = await prisma.attendanceLog.findMany({
      where: { companyId: user.employee.companyId },
      include: { employee: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { attendanceDate: 'desc' },
      take: 30
    });
    console.log('\n--- All Company Attendance Logs (count: ' + companyLogs.length + ') ---');
    companyLogs.forEach(l => {
      console.log(`[${l.attendanceDate.toISOString().split('T')[0]}] ${l.employee?.firstName} ${l.employee?.lastName} (${l.employee?.email}) | Shift: ${l.shiftName} (${l.shiftStartTime}-${l.shiftEndTime}) | Status: ${l.status}`);
    });
  }
}

main().catch(console.error).finally(() => process.exit(0));
