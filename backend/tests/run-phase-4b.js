import { runCompanyTests } from './companies.test.js';
import { runEmployeeTests } from './employees.test.js';
import { runOrganizationTests } from './organization.test.js';
import { runDocumentTests } from './documents.test.js';
import { runReportTests } from './reports.test.js';

async function main() {
  console.log('================================================================');
  console.log('STARTING PHASE 4B CORE HR & ADMIN MODULES INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  try {
    // 1. Company Module (2-Step OTP, Subscription, Stats, Analytics)
    const companyResult = await runCompanyTests();
    const companyId = companyResult.createdCompanyId;

    // 2. Employee Module (2-Step OTP, Bulk Import, Export, Stats)
    const employeeResult = await runEmployeeTests(companyId);
    const employeeId = employeeResult.createdEmployeeId;

    // 3. Organization Module (Branches, Departments, Designations)
    await runOrganizationTests(companyId);

    // 4. Document Module (Creation, Verification, Download, Stats)
    await runDocumentTests(companyId, employeeId);

    // 5. Reports Module (All 8 Report Types, CSV/Excel/PDF Exports, History)
    await runReportTests(companyId);

    console.log('\n================================================================');
    console.log('🎉 ALL PHASE 4B TESTS PASSED WITH 100% OK RESPONSES ON FULL PAYLOADS');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 4B INTEGRATION TEST SUITE FAILED:', err);
    process.exit(1);
  }
}

main();
