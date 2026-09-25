import { runNotificationTests } from './notifications.test.js';

async function main() {
  console.log('====================================================');
  console.log('STARTING PHASE 4A ROLE DASHBOARDS & NOTIFICATIONS AUTOMATED INTEGRATION TESTS');
  console.log('====================================================\n');

  try {
    await runNotificationTests();
    console.log('\n====================================================');
    console.log('ALL PHASE 4A TESTS PASSED WITH 100% OK RESPONSES');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 4A INTEGRATION TEST SUITE FAILED:', err);
    process.exit(1);
  }
}

main();
