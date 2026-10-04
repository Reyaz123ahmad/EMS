import prisma from '../src/config/prisma.js';
import { markAbsenteesForCompany } from '../src/modules/attendance/services/markAbsentees.service.js';

async function main() {
  const company = await prisma.company.findFirst({
    where: { id: '925af98c-24d1-4f9f-8f87-97a55734c7cd' }
  });
  console.log('Company:', company?.id, company?.name);

  // Check logs created on 2026-10-03
  const logsOct3 = await prisma.attendanceLog.findMany({
    where: {
      companyId: company.id,
      attendanceDate: new Date('2026-10-03T00:00:00.000Z')
    },
    include: { employee: true }
  });

  console.log('\n--- Oct 3 Logs (Count: ' + logsOct3.length + ') ---');
  logsOct3.forEach(l => {
    console.log(`Log ID: ${l.id} | Emp: ${l.employee?.firstName} ${l.employee?.lastName} (${l.employee?.email}) | Shift: ${l.shiftName} | CreatedAt: ${l.createdAt.toISOString()}`);
  });

  // Let's test running markAbsenteesForCompany for Oct 3 with forceAllShifts
  console.log('\n--- Running markAbsenteesForCompany for Oct 3 (date: 2026-10-03) ---');
  const resOct3 = await markAbsenteesForCompany(company.id, {
    date: new Date('2026-10-03T00:00:00.000Z'),
    currentTime: new Date('2026-10-03T23:59:59.000Z')
  });
  console.log('Result for Oct 3:', resOct3);

  // Let's test running markAbsenteesForCompany for Oct 2
  console.log('\n--- Running markAbsenteesForCompany for Oct 2 (date: 2026-10-02) ---');
  const resOct2 = await markAbsenteesForCompany(company.id, {
    date: new Date('2026-10-02T00:00:00.000Z'),
    currentTime: new Date('2026-10-02T23:59:59.000Z')
  });
  console.log('Result for Oct 2:', resOct2);

  // Let's test running markAbsenteesForCompany for Oct 1
  console.log('\n--- Running markAbsenteesForCompany for Oct 1 (date: 2026-10-01) ---');
  const resOct1 = await markAbsenteesForCompany(company.id, {
    date: new Date('2026-10-01T00:00:00.000Z'),
    currentTime: new Date('2026-10-01T23:59:59.000Z')
  });
  console.log('Result for Oct 1:', resOct1);
}

main().catch(console.error).finally(() => process.exit(0));
