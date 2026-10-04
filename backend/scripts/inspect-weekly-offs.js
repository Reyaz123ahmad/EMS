import prisma from '../src/config/prisma.js';

async function main() {
  const weeklyOffRules = await prisma.weeklyOffRule.findMany({
    include: { company: { select: { id: true, name: true } } }
  });
  console.log('Weekly Off Rules in DB:');
  console.log(JSON.stringify(weeklyOffRules, null, 2));

  const holidayCalendars = await prisma.holidayCalendar.findMany({
    include: { holidays: true }
  });
  console.log('\nHoliday Calendars in DB:');
  console.log(JSON.stringify(holidayCalendars, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
