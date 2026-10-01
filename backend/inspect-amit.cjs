const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

  console.log('USER:', user?.email, 'ROLE:', user?.role);
  console.log('COMPANY ID:', user?.companyId);
  console.log('EMPLOYEE ID:', user?.employee?.id);
  console.log('EMPLOYEE NAME:', user?.employee?.firstName, user?.employee?.lastName);
  console.log('EMPLOYEE CODE:', user?.employee?.employeeCode);
  console.log('SHIFT ASSIGNMENTS:', JSON.stringify(user?.employee?.shiftAssignments, null, 2));

  // Find rosters specifically for Oct 1 2026 or today
  const today = new Date();
  const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

  const allRosters = await prisma.roster.findMany({
    where: { employeeId: user?.employee?.id },
    include: { shift: true }
  });
  console.log('ALL AMIT BHAI ROSTERS IN DB:', allRosters.map(r => ({ id: r.id, dateISO: r.date.toISOString(), shiftName: r.shift?.name })));

  const { resolveShiftForEmployee, getEffectiveShiftOverview } = await import('./src/modules/shifts/services/shift-resolver.service.js');

  if (user?.employee) {
    const resolved = await resolveShiftForEmployee({
      employeeId: user.employee.id,
      companyId: user.companyId,
      date: new Date()
    });
    console.log('RESOLVED SHIFT FOR AMIT BHAI (resolveShiftForEmployee):', JSON.stringify(resolved, null, 2));

    const overview = await getEffectiveShiftOverview({
      employeeId: user.employee.id,
      companyId: user.companyId,
      date: new Date()
    });
    console.log('EFFECTIVE OVERVIEW FOR AMIT BHAI:', JSON.stringify(overview, null, 2));
  }

  // Also check shiftAssignments table directly for Amit Bhai
  const directAssignments = await prisma.shiftAssignment.findMany({
    where: { employeeId: user?.employee?.id },
    include: { shift: true }
  });
  console.log('DIRECT SHIFT ASSIGNMENTS:', JSON.stringify(directAssignments, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
