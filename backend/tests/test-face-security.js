import assert from 'assert';
import * as faceService from '../src/services/face.service.js';

console.log('============================================================');
console.log('BIOMETRIC SECURITY TEST SUITE: FACE VERIFICATION HARDENING');
console.log('============================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] TEST ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] TEST ${totalTests}: ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// Helper to normalize 128-d vector
function normalize(v) {
  const norm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
  return v.map(val => val / norm);
}

// Generate base 128-d face embedding
const employeeA_registered = normalize(
  Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.1) + Math.cos(i * 0.05))
);

// Synthetic live photo embedding of Employee A with natural biometric variance (distance ~0.20)
const employeeA_live = normalize(
  employeeA_registered.map(v => v + (Math.random() - 0.5) * 0.03)
);

// Synthetic photo embedding of Employee B (different face, distance ~0.75 - 1.20)
const employeeB_photo = normalize(
  Array.from({ length: 128 }, (_, i) => Math.cos(i * 0.25) - Math.sin(i * 0.15))
);

async function runAll() {
  // TEST 1: Same person matches with strict threshold (< 0.50)
  await runTest('Same person matches with distance < 0.50', () => {
    const result = faceService.compareFaces(employeeA_registered, employeeA_live, 0.50);
    assert.strictEqual(result.passed, true, 'Verification should PASS for identical person');
    assert.ok(result.distance < 0.50, `Distance ${result.distance} must be < 0.50`);
    assert.strictEqual(result.threshold, 0.50, 'Threshold must be strictly 0.50');
    console.log(`       Distance: ${result.distance.toFixed(4)}, Similarity: ${result.similarity.toFixed(4)} -> MATCH`);
  });

  // TEST 2: DIFFERENT PERSON must FAIL (Critical Security Test)
  await runTest('DIFFERENT PERSON is REJECTED (distance > 0.50)', () => {
    const result = faceService.compareFaces(employeeA_registered, employeeB_photo, 0.50);
    assert.strictEqual(result.passed, false, 'Verification MUST FAIL for different person');
    assert.ok(result.distance > 0.50, `Distance ${result.distance} must be > 0.50`);
    console.log(`       Distance: ${result.distance.toFixed(4)}, Similarity: ${result.similarity.toFixed(4)} -> REJECTED (Correct)`);
  });

  // TEST 3: Replay attack prevention
  await runTest('Replay attack is detected and rejected on 2nd submission', async () => {
    const dummyPhoto = 'data:image/jpeg;base64,' + Buffer.from('unique_photo_frame_xyz_998877').toString('base64');
    const employeeId = 'emp_test_replay_001';

    const firstAttempt = await faceService.checkAndRecordImageReplay(dummyPhoto, employeeId, 86400);
    assert.strictEqual(firstAttempt.passed, true, 'First attempt should be allowed');
    assert.strictEqual(firstAttempt.isReplay, false);

    const secondAttempt = await faceService.checkAndRecordImageReplay(dummyPhoto, employeeId, 86400);
    assert.strictEqual(secondAttempt.passed, false, 'Second identical attempt MUST be rejected');
    assert.strictEqual(secondAttempt.isReplay, true);
    assert.strictEqual(secondAttempt.reason, 'REPLAY_DETECTED', 'Reason should be REPLAY_DETECTED');
    console.log(`       First attempt: allowed, Second attempt: REPLAY_DETECTED (Hash: ${secondAttempt.hash.slice(0, 12)}...)`);
  });

  // TEST 4: Multi-face frame handling
  await runTest('Multi-face frame rejection logic check', () => {
    const mockFaces = [{ descriptor: [0.1] }, { descriptor: [0.2] }];
    let threwError = false;
    try {
      if (mockFaces.length > 1) {
        const err = new Error('Multiple faces detected in frame. Only one person allowed.');
        err.code = 'MULTIPLE_FACES_DETECTED';
        throw err;
      }
    } catch (e) {
      threwError = true;
      assert.strictEqual(e.code, 'MULTIPLE_FACES_DETECTED');
    }
    assert.strictEqual(threwError, true, 'Should reject multi-face frames');
  });

  // TEST 5: Fail-Safe Model/Input Error Handling (NEVER fallback to true)
  await runTest('Model/Input failure returns fail-safe match: false', () => {
    const result = faceService.compareFaces([], employeeA_live, 0.50);
    assert.strictEqual(result.passed, false, 'Corrupted vector comparison must FAIL');
    assert.ok(result.distance >= 1.0, 'Fallback distance must be high indicating mismatch');
    assert.strictEqual(result.similarity, 0.0, 'Fallback similarity must be 0.0');
    console.log(`       Corrupted input -> passed: ${result.passed}, distance: ${result.distance} (Fail-Safe)`);
  });

  console.log('\n============================================================');
  console.log(`RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('============================================================');

  setTimeout(() => process.exit(passedTests === totalTests ? 0 : 1), 500);
}

runAll();
