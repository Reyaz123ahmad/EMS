import { prisma } from '../src/config/prisma.js';
import { markAbsenteesForCompany, calculateShiftGraceCutoff } from '../src/modules/attendance/services/markAbsentees.service.js';

async function runTests() {
  console.log('============================================================');
  console.log('AUTO-ABSENT GLOBAL LOGIC VERIFICATION');
  console.log('============================================================');

  const companies = await prisma.company.findMany({
    where: { status: 'ACTIVE' }
  });

  console.log(`Found ${companies.length} active companies.`);

  for (const company of companies) {
    const companyId = company.id;
    console.log(`\n============================================================`);
    console.log(`TESTING COMPANY: ${company.name} (${companyId})`);
    console.log(`============================================================`);

    // Clean up test attendance logs for Oct 4 and Oct 5
    await prisma.attendanceLog.deleteMany({
      where: {
        companyId,
        attendanceDate: {
          in: [
            new Date(Date.UTC(2026, 9, 4, 0, 0, 0, 0)),
            new Date(Date.UTC(2026, 9, 5, 0, 0, 0, 0))
          ]
        }
      }
    });

    // ----------------------------------------------------
    // TEST 1: Oct 4, 2026 (Sunday - Weekly Off)
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Oct 4, 2026 (Sunday - Weekly Off) ---');
    const resSunday = await markAbsenteesForCompany(companyId, {
      date: new Date('2026-10-04T12:01:00.000Z'),
      currentTime: new Date('2026-10-04T12:01:00.000Z')
    });
    console.log('Result for Oct 4 (Sunday):', {
      marked: resSunday.marked,
      skipped: resSunday.skipped,
      reason: resSunday.reason
    });

    const logsOct4 = await prisma.attendanceLog.findMany({
      where: {
        companyId,
        attendanceDate: new Date(Date.UTC(2026, 9, 4, 0, 0, 0, 0))
      }
    });
    console.log(`DB check for Oct 4: ${logsOct4.length} records found (Expected: 0)`);
    if (resSunday.marked !== 0 || logsOct4.length !== 0) {
      console.error('FAILED TEST 1: Absent records created on Sunday!');
      process.exit(1);
    } else {
      console.log('PASS TEST 1: Sunday correctly identified as Weekly Off. No records created.');
    }

    // ----------------------------------------------------
    // TEST 2: Oct 5, 2026 (Monday) at 12:01 PM
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Oct 5, 2026 (Monday) at 12:01 PM ---');
    const resMonNoon = await markAbsenteesForCompany(companyId, {
      date: new Date('2026-10-05T00:00:00.000Z'),
      currentTime: new Date('2026-10-05T12:01:00.000') // 12:01 PM local
    });
    console.log('Result for Monday at 12:01 PM:', {
      marked: resMonNoon.marked,
      skipped: resMonNoon.skipped
    });

    resMonNoon.details.forEach(d => {
      console.log(` - Employee: ${d.employeeCode || d.employeeId} | Shift: ${d.shiftName || 'N/A'} (${d.shiftStartTime || 'N/A'}) | Action: ${d.action} | Reason: ${d.reason || 'N/A'}`);
      if (d.shiftStartTime) {
        const [h] = d.shiftStartTime.split(':').map(Number);
        if (h >= 13) {
          // Evening/Night shift after 12:01 PM
          if (d.action !== 'SKIPPED' || d.reason !== 'GRACE_NOT_PASSED') {
            console.error(`FAILED TEST 2: Late shift ${d.shiftStartTime} should have been skipped at 12:01 PM!`);
            process.exit(1);
          }
        } else if (h <= 11) {
          // Morning/Day shift before 12:01 PM
          if (d.action !== 'MARKED_ABSENT') {
            console.error(`FAILED TEST 2: Day shift ${d.shiftStartTime} should have been marked absent by 12:01 PM!`);
            process.exit(1);
          }
        }
      }
    });
    console.log('PASS TEST 2: 12:01 PM evaluations correctly distinguished Day vs Night shifts.');

    // Clean up test data before TEST 3
    await prisma.attendanceLog.deleteMany({
      where: {
        companyId,
        attendanceDate: new Date(Date.UTC(2026, 9, 5, 0, 0, 0, 0))
      }
    });

    // ----------------------------------------------------
    // TEST 3: Oct 5, 2026 (Monday) at 23:30 PM (Late Night - All shifts concluded start)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Oct 5, 2026 (Monday) at 23:30 PM ---');
    const resMonLate = await markAbsenteesForCompany(companyId, {
      date: new Date('2026-10-05T00:00:00.000Z'),
      currentTime: new Date('2026-10-05T23:30:00.000') // 23:30 PM local
    });
    console.log('Result for Monday at 23:30 PM:', {
      marked: resMonLate.marked,
      skipped: resMonLate.skipped
    });

    resMonLate.details.forEach(d => {
      console.log(` - Employee: ${d.employeeCode || d.employeeId} | Shift: ${d.shiftName || 'N/A'} (${d.shiftStartTime || 'N/A'}) | Action: ${d.action} | Reason: ${d.reason || 'N/A'}`);
      if (d.action !== 'MARKED_ABSENT' && d.reason !== 'ON_APPROVED_LEAVE' && d.reason !== 'WEEKLY_OFF' && d.reason !== 'NO_SHIFT_ASSIGNED') {
        console.error(`FAILED TEST 3: Employee ${d.employeeCode} not marked absent at 23:30 PM!`);
        process.exit(1);
      }
    });
    console.log('PASS TEST 3: All shifts successfully marked ABSENT after their respective grace periods.');

    // Clean up test data for Oct 5
    await prisma.attendanceLog.deleteMany({
      where: {
        companyId,
        attendanceDate: new Date(Date.UTC(2026, 9, 5, 0, 0, 0, 0))
      }
    });
  }

  console.log('\n============================================================');
  console.log('SUCCESS: ALL TESTS PASSED ACROSS ALL COMPANIES, SHIFTS & EMPLOYEES!');
  console.log('============================================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
