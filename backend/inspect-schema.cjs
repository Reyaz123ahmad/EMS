const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  console.log('COMPANY TIMEZONE:', company?.timezone);
  console.log('COMPANY KEYS:', Object.keys(company || {}));

  const leaveReq = await prisma.leaveRequest.findFirst();
  console.log('LEAVE REQUEST KEYS:', leaveReq ? Object.keys(leaveReq) : 'null');

  const weeklyOff = await prisma.weeklyOffRule.findFirst();
  console.log('WEEKLY OFF KEYS:', weeklyOff ? Object.keys(weeklyOff) : 'null');

  const holidayCal = await prisma.holidayCalendar.findFirst({
    include: { holidays: true }
  });
  console.log('HOLIDAY CALENDAR:', JSON.stringify(holidayCal, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
