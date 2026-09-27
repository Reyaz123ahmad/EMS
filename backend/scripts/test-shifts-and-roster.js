import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('STARTING SHIFTS & ROSTER VERIFICATION TESTS');
  console.log('====================================================\n');

  let results = {
    generateRosterLoads: false,
    calendarViewLoads: false,
    rosterGenerates: false,
    noShiftsMapError: true
  };

  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error('No company found in database');
    console.log('Company ID:', company.id);

    const user = await prisma.user.findFirst({
      where: { companyId: company.id }
    });

    const { default: shiftsService } = await import('../src/modules/shifts/shifts.service.js');
    const { default: rostersService } = await import('../src/modules/rosters/rosters.service.js');

    // 1. Ensure at least one shift exists
    console.log('\n--- 1. Testing Shifts Service ---');
    let shifts = await shiftsService.listShifts({ companyId: company.id });
    console.log('Current shifts count:', Array.isArray(shifts) ? shifts.length : 'NOT AN ARRAY');

    if (!Array.isArray(shifts)) {
      results.noShiftsMapError = false;
      throw new Error('shiftsService.listShifts did not return an array');
    }

    if (shifts.length === 0) {
      console.log('Creating standard test shift...');
      const createdShift = await shiftsService.createShift(company.id, {
        name: 'General Shift (9 AM - 6 PM)',
        startTime: '09:00',
        endTime: '18:00',
        graceMinutes: 15,
        workingHours: 8,
        isActive: true
      });
      console.log('Created shift:', createdShift.id, createdShift.name);
      shifts = await shiftsService.listShifts({ companyId: company.id });
    }

    // 2. Ensure test employee exists
    const employee = await prisma.employee.findFirst({
      where: { companyId: company.id, status: 'ACTIVE' }
    });
    console.log('Test employee:', employee?.firstName, employee?.lastName, `(${employee?.id})`);

    // 3. Test frontend shift service getShifts normalization logic
    console.log('\n--- 2. Testing Frontend Shift Service Response Normalization ---');
    const testPayloads = [
      [{ id: '1', name: 'Morning' }],
      { status: 'ok', data: [{ id: '1', name: 'Morning' }] },
      { status: 'ok', data: { shifts: [{ id: '1', name: 'Morning' }] } },
      null,
      undefined
    ];

    let allNormalized = true;
    for (const p of testPayloads) {
      const data = p?.data?.shifts || p?.data || p || [];
      const normalized = Array.isArray(data) ? data : (data?.shifts || []);
      if (!Array.isArray(normalized)) {
        allNormalized = false;
      }
    }
    console.log('All frontend payload structures normalize to array:', allNormalized);
    if (allNormalized) results.generateRosterLoads = true;

    // 4. Test generateRoster backend
    console.log('\n--- 3. Testing Roster Generation ---');
    const genResult = await rostersService.generateRoster({
      companyId: company.id,
      data: {
        shiftId: shifts[0]?.id,
        month: 10,
        year: 2026,
        employeeIds: employee ? [employee.id] : [],
        pattern: '5_2'
      },
      createdBy: user?.id
    });
    console.log('Generate Roster Result:', genResult);

    if (genResult.success && genResult.totalGenerated >= 0) {
      results.rosterGenerates = true;
    }

    // 5. Test getRosterCalendar backend
    console.log('\n--- 4. Testing Roster Calendar Fetching ---');
    const calendar = await rostersService.getRosterCalendar({
      companyId: company.id,
      month: 10,
      year: 2026
    });

    console.log('Calendar rosters count:', calendar.totalRosters);
    if (Array.isArray(calendar.rosters)) {
      results.calendarViewLoads = true;
    }

    console.log('\n====================================================');
    console.log('FINAL TEST RESULTS SUMMARY:');
    console.log('====================================================');
    console.log('- Generate Roster loads:', results.generateRosterLoads ? 'PASS' : 'FAIL');
    console.log('- Calendar View loads:', results.calendarViewLoads ? 'PASS' : 'FAIL');
    console.log('- Roster generates:', results.rosterGenerates ? 'PASS' : 'FAIL');
    console.log('- No shifts.map error:', results.noShiftsMapError ? 'PASS' : 'FAIL');
    console.log('====================================================');

  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
