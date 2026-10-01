const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    where: { companyId: '925af98c-24d1-4f9f-8f87-97a55734c7cd' },
    include: {
      user: true,
      shiftAssignments: { include: { shift: true } },
      rosters: { include: { shift: true } }
    }
  });

  const { attendanceService } = await import('./src/modules/attendance/attendance.service.js');

  const ejaz = await attendanceService.getTodayStatus('a630b326-2710-4d27-885d-1a1f60438661', '925af98c-24d1-4f9f-8f87-97a55734c7cd');
  console.log('=== 1. EJAZ AHMAD (Night Shift 21:00 - 06:00) ===');
  console.log('Shift Name:', ejaz.currentShift?.name);
  console.log('Shift Times:', ejaz.currentShift?.startTime + ' - ' + ejaz.currentShift?.endTime);
  console.log('Window Status:', ejaz.windowStatus);
  console.log('Can Check In (Button):', ejaz.canCheckIn ? 'ENABLED' : 'DISABLED');
  console.log('Message:', ejaz.checkInBlockReason);

  const sarah = await attendanceService.getTodayStatus('19c186a1-421f-45ee-bf43-e52179da29f9', '18991b1f-ae76-4654-9eb5-827d00f68d6f');
  console.log('\n=== 3. SARAH CONNOR (General Shift 09:00 - 18:00, No Roster) ===');
  console.log('Shift Name:', sarah.currentShift?.name);
  console.log('Shift Times:', sarah.currentShift?.startTime + ' - ' + sarah.currentShift?.endTime);
  console.log('Window Status:', sarah.windowStatus);
  console.log('Can Check In (Button):', sarah.canCheckIn ? 'ENABLED' : 'DISABLED');
  console.log('Message:', sarah.checkInBlockReason);
}

main().catch(console.error).finally(() => prisma.$disconnect());
