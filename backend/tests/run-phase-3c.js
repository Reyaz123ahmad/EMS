import { runFaceRegistrationTests } from './face-registration.test.js';
import { runFingerAttendanceTests } from './finger-attendance.test.js';
import { runAdvancedSecurityTests } from './advanced-security.test.js';

async function main() {
  console.log('====================================================');
  console.log('STARTING PHASE 3C BIOMETRIC ECOSYSTEM AUTOMATED INTEGRATION TESTS');
  console.log('====================================================\n');

  try {
    await runFaceRegistrationTests();
    console.log('\n----------------------------------------------------\n');
    await runFingerAttendanceTests();
    console.log('\n----------------------------------------------------\n');
    await runAdvancedSecurityTests();
    console.log('\n====================================================');
    console.log('ALL PHASE 3C TESTS PASSED WITH 100% OK RESPONSES');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 3C INTEGRATION TEST SUITE FAILED:', err);
    process.exit(1);
  }
}

main();
