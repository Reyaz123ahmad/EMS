import runCardsTests from './biometric-cards.test.js';
import runDevicesTests from './biometric-devices.test.js';

async function main() {
  try {
    console.log('====================================================');
    console.log('STARTING PHASE 3B AUTOMATED INTEGRATION TESTS');
    console.log('====================================================\n');

    await runCardsTests();
    console.log('\n----------------------------------------------------\n');
    await runDevicesTests();

    console.log('\n====================================================');
    console.log('ALL PHASE 3B TESTS PASSED WITH 100% OK RESPONSES');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 3B TEST SUITE FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
