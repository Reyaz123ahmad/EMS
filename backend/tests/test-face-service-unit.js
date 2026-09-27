import { loadModels, compareFaces, cosineSimilarity } from '../src/services/face.service.js';

async function testFaceService() {
  console.log('Testing face.service.js...');
  await loadModels();
  console.log('Models loaded successfully.');

  // Test vector comparisons
  const vec1 = Array.from({ length: 128 }, (_, i) => Math.sin(i) + 0.5);
  const vec2 = Array.from({ length: 128 }, (_, i) => Math.sin(i) + 0.5); // identical
  const vec3 = Array.from({ length: 128 }, (_, i) => Math.cos(i * 2) - 0.2); // different

  const match1 = compareFaces(vec1, vec2, 0.75);
  console.log('Identical vector match:', match1);

  const match2 = compareFaces(vec1, vec3, 0.75);
  console.log('Different vector match:', match2);

  if (match1.passed && !match2.passed) {
    console.log('✅ Unit comparison tests: PASS');
  } else {
    console.log('❌ Unit comparison tests: FAIL');
  }
}

testFaceService().catch(console.error);
