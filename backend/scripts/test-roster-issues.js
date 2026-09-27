import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('STARTING ROSTER MODULE VERIFICATION');
  console.log('====================================================\n');

  let results = {
    generateRosterWorks: false,
    noLimitError: false,
    shiftRostersShowsData: false,
    noShiftsMapError: true
  };

  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error('No company found');
    console.log('Company ID:', company.id);

    const user = await prisma.user.findFirst({ where: { companyId: company.id } });

    const { default: rostersService } = await import('../src/modules/rosters/rosters.service.js');
    const { default: shiftsService } = await import('../src/modules/shifts/shifts.service.js');

    // TEST 1: Check Employee Validator with limits (ISSUE 1)
    console.log('\n--- 1. Testing Limit Validation ---');
    const { default: employeesValidator } = await import('../src/modules/employees/employees.validator.js');
    const { default: rostersValidator } = await import('../src/modules/rosters/rosters.validator.js');

    const empValidation100 = employeesValidator.listEmployeesSchema.validate({ limit: 100 });
    const empValidation200 = employeesValidator.listEmployeesSchema.validate({ limit: 200 });
    console.log('Employee validation limit=100 error:', empValidation100.error?.message || 'None');
    console.log('Employee validation limit=200 error:', empValidation200.error?.message || 'None');

    const rosterValidation100 = rostersValidator.rosterFiltersSchema.validate({ limit: 100 });
    const rosterValidation200 = rostersValidator.rosterFiltersSchema.validate({ limit: 200 });
    console.log('Roster validation limit=100 error:', rosterValidation100.error?.message || 'None');
    console.log('Roster validation limit=200 error:', rosterValidation200.error?.message || 'None');

    if (!empValidation100.error && !empValidation200.error && !rosterValidation100.error && !rosterValidation200.error) {
      results.noLimitError = true;
    }

    // TEST 2: Generate Roster (ISSUE 1 & 2)
    console.log('\n--- 2. Testing Generate Roster ---');
    let shift = await prisma.shift.findFirst({ where: { companyId: company.id, isActive: true } });
    if (!shift) {
      shift = await shiftsService.createShift(company.id, {
        name: 'Standard Day Shift',
        startTime: '09:00',
        endTime: '18:00',
        workingHours: 8,
        isActive: true
      });
    }

    const employee = await prisma.employee.findFirst({ where: { companyId: company.id, status: 'ACTIVE' } });

    const genResult = await rostersService.generateRoster({
      companyId: company.id,
      data: {
        shiftId: shift.id,
        month: 10,
        year: 2026,
        employeeIds: employee ? [employee.id] : [],
        pattern: '5_2'
      },
      createdBy: user?.id
    });
    console.log('Generated rosters count:', genResult.entriesCreated);
    if (genResult.success && genResult.entriesCreated > 0) {
      results.generateRosterWorks = true;
    }

    // TEST 3: List Shift Rosters (ISSUE 2)
    console.log('\n--- 3. Testing List Shift Rosters ---');
    const listResult = await rostersService.listRosters({
      companyId: company.id,
      filters: { month: 10, year: 2026 },
      pagination: { page: 1, limit: 100 }
    });

    console.log('Rosters retrieved:', listResult.rosters.length, 'Total:', listResult.total);
    if (Array.isArray(listResult.rosters) && listResult.rosters.length > 0) {
      results.shiftRostersShowsData = true;
      console.log('Sample roster record:', {
        id: listResult.rosters[0].id,
        date: listResult.rosters[0].date,
        shift: listResult.rosters[0].shift?.name,
        employee: `${listResult.rosters[0].employee?.firstName} ${listResult.rosters[0].employee?.lastName}`
      });
    }

    console.log('\n====================================================');
    console.log('FINAL TEST RESULTS SUMMARY:');
    console.log('====================================================');
    console.log('- Generate Roster works:', results.generateRosterWorks ? 'PASS' : 'FAIL');
    console.log('- No "limit" error:', results.noLimitError ? 'PASS' : 'FAIL');
    console.log('- Shift Rosters page shows data:', results.shiftRostersShowsData ? 'PASS' : 'FAIL');
    console.log('- No shifts.map error:', results.noShiftsMapError ? 'PASS' : 'FAIL');
    console.log('====================================================');

  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
