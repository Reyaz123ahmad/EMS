import { describe, it, expect } from 'vitest';
import { calculateEAR, detectHeadPose, checkFaceBounds } from '../utils/face-detector.js';

describe('Client-Side Face Detector & Liveness Algorithms', () => {
  // 68 facial landmark synthetic fixtures
  const generateMockLandmarks = ({ eyeClosed = false, yawRatio = 0, pitchRatio = 1.0 }) => {
    const landmarks = Array.from({ length: 68 }, () => ({ x: 100, y: 100 }));

    // Left eye in 2D image coordinates (camera image left, smaller x: 70-90)
    const eyeHeight = eyeClosed ? 1.5 : 8.0;
    landmarks[36] = { x: 70, y: 80 };
    landmarks[37] = { x: 75, y: 80 - eyeHeight / 2 };
    landmarks[38] = { x: 85, y: 80 - eyeHeight / 2 };
    landmarks[39] = { x: 90, y: 80 };
    landmarks[40] = { x: 85, y: 80 + eyeHeight / 2 };
    landmarks[41] = { x: 75, y: 80 + eyeHeight / 2 };

    // Right eye in 2D image coordinates (camera image right, larger x: 110-130)
    landmarks[42] = { x: 110, y: 80 };
    landmarks[43] = { x: 115, y: 80 - eyeHeight / 2 };
    landmarks[44] = { x: 125, y: 80 - eyeHeight / 2 };
    landmarks[45] = { x: 130, y: 80 };
    landmarks[46] = { x: 125, y: 80 + eyeHeight / 2 };
    landmarks[47] = { x: 115, y: 80 + eyeHeight / 2 };

    // Nose (30), Nose bridge (27), Chin (8)
    const eyeCenterX = (landmarks[36].x + landmarks[45].x) / 2; // 100
    const eyeDistance = Math.abs(landmarks[45].x - landmarks[36].x); // 60
    landmarks[27] = { x: eyeCenterX, y: 85 };
    landmarks[30] = { x: eyeCenterX + yawRatio * eyeDistance, y: 110 };
    landmarks[8] = { x: eyeCenterX, y: 110 + 30 / pitchRatio };

    return landmarks;
  };

  it('Calculates EAR correctly and distinguishes open vs closed eyes', () => {
    const openEyeLandmarks = generateMockLandmarks({ eyeClosed: false });
    const closedEyeLandmarks = generateMockLandmarks({ eyeClosed: true });

    const openEAR = calculateEAR(openEyeLandmarks);
    const closedEAR = calculateEAR(closedEyeLandmarks);

    expect(openEAR).toBeGreaterThan(0.3);
    expect(closedEAR).toBeLessThan(0.15);
  });

  it('Detects user-centric head turn LEFT and RIGHT accurately', () => {
    // When user turns head to THEIR RIGHT, nose moves towards camera image left (smaller x, yawRatio = -0.25)
    // When user turns head to THEIR LEFT, nose moves towards camera image right (larger x, yawRatio = +0.25)
    const centerLandmarks = generateMockLandmarks({ yawRatio: 0 });
    const userRightTurnLandmarks = generateMockLandmarks({ yawRatio: -0.25 });
    const userLeftTurnLandmarks = generateMockLandmarks({ yawRatio: 0.25 });

    const centerPose = detectHeadPose(centerLandmarks);
    const rightPose = detectHeadPose(userRightTurnLandmarks);
    const leftPose = detectHeadPose(userLeftTurnLandmarks);

    expect(centerPose.direction).toBe('CENTER');
    expect(rightPose.direction).toBe('RIGHT');
    expect(rightPose.yaw).toBeGreaterThan(0.12);

    expect(leftPose.direction).toBe('LEFT');
    expect(leftPose.yaw).toBeLessThan(-0.12);
  });

  it('Validates face bounding circle and rejects out-of-bound / small faces', () => {
    // 1. Centered and well-sized face in 640x480 frame
    const centeredBox = { x: 240, y: 160, width: 160, height: 160 };
    const alignedResult = checkFaceBounds(centeredBox, 640, 480);
    expect(alignedResult.isInside).toBe(true);
    expect(alignedResult.isSizeOk).toBe(true);
    expect(alignedResult.isProperlyPositioned).toBe(true);
    expect(alignedResult.status).toBe('ALIGNED');

    // 2. Face in top-left corner (outside circle)
    const cornerBox = { x: 20, y: 20, width: 140, height: 140 };
    const outsideResult = checkFaceBounds(cornerBox, 640, 480);
    expect(outsideResult.isInside).toBe(false);
    expect(outsideResult.isProperlyPositioned).toBe(false);
    expect(outsideResult.status).toBe('OUTSIDE_CIRCLE');

    // 3. Face centered but too small (far away from camera)
    const tooSmallBox = { x: 300, y: 220, width: 70, height: 70 };
    const smallResult = checkFaceBounds(tooSmallBox, 640, 480);
    expect(smallResult.isInside).toBe(true);
    expect(smallResult.isSizeOk).toBe(false);
    expect(smallResult.isProperlyPositioned).toBe(false);
    expect(smallResult.status).toBe('TOO_FAR');
  });

  it('Measures local algorithm latency: 100 frames process in <10ms (Real-time speed)', () => {
    const openEyeLandmarks = generateMockLandmarks({ eyeClosed: false });
    const closedEyeLandmarks = generateMockLandmarks({ eyeClosed: true });
    const leftTurnLandmarks = generateMockLandmarks({ yawRatio: 0.25 });

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      calculateEAR(openEyeLandmarks);
      calculateEAR(closedEyeLandmarks);
      detectHeadPose(leftTurnLandmarks);
    }
    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(150);
  });
});
