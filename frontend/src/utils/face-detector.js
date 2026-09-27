import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let loadingPromise = null;

export async function loadFaceModels() {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);
      modelsLoaded = true;
      console.log('✅ Client-side Face models loaded successfully');
    } catch (err) {
      loadingPromise = null;
      console.error('Failed to load face models:', err);
      throw err;
    }
  })();

  return loadingPromise;
}

export function isModelLoaded() {
  return modelsLoaded;
}

/**
 * Detect face + landmarks + embedding in ONE pass
 * Returns: { embedding, landmarks, box, score }
 */
export async function detectFace(videoElement) {
  if (!modelsLoaded) {
    await loadFaceModels();
  }

  const detection = await faceapi
    .detectSingleFace(
      videoElement,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 224, // Smaller = faster (sub-100ms)
        scoreThreshold: 0.5
      })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return null;
  }

  return {
    embedding: Array.from(detection.descriptor),
    landmarks: detection.landmarks.positions.map((p) => ({ x: p.x, y: p.y })),
    box: {
      x: detection.detection.box.x,
      y: detection.detection.box.y,
      width: detection.detection.box.width,
      height: detection.detection.box.height
    },
    score: detection.detection.score
  };
}

/**
 * Calculate EAR (Eye Aspect Ratio) for blink detection
 */
export function calculateEAR(landmarks) {
  if (!landmarks || landmarks.length < 48) return 0;

  const leftEye = landmarks.slice(36, 42);
  const rightEye = landmarks.slice(42, 48);

  const leftEAR = eyeAspectRatio(leftEye);
  const rightEAR = eyeAspectRatio(rightEye);

  return (leftEAR + rightEAR) / 2;
}

function eyeAspectRatio(eye) {
  if (!eye || eye.length < 6) return 0;

  const v1 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
  const v2 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
  const h = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);

  if (h === 0) return 0;
  return (v1 + v2) / (2 * h);
}

/**
 * Detect head pose (Yaw & Pitch)
 */
export function detectHeadPose(landmarks) {
  if (!landmarks || landmarks.length < 68) {
    return { yaw: 0, pitch: 0, direction: 'CENTER' };
  }

  const nose = landmarks[30];
  const leftEye = landmarks[36];
  const rightEye = landmarks[45];
  const chin = landmarks[8];
  const noseBridge = landmarks[27];

  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const eyeDistance = Math.abs(rightEye.x - leftEye.x);

  if (eyeDistance === 0) return { yaw: 0, pitch: 0, direction: 'CENTER' };

  // Yaw: horizontal ratio
  const yaw = (nose.x - eyeCenterX) / eyeDistance;

  // Pitch: vertical ratio between eye-nose and nose-chin
  const upperFaceHeight = Math.abs(nose.y - eyeCenterY);
  const lowerFaceHeight = Math.abs(chin.y - nose.y);
  const pitchRatio = lowerFaceHeight === 0 ? 1 : upperFaceHeight / lowerFaceHeight;

  let direction = 'CENTER';
  if (yaw < -0.12) {
    direction = 'LEFT';
  } else if (yaw > 0.12) {
    direction = 'RIGHT';
  } else if (pitchRatio > 1.35 || (noseBridge && nose.y - noseBridge.y < 15)) {
    direction = 'UP';
  } else if (pitchRatio < 0.7) {
    direction = 'DOWN';
  }

  return { yaw, pitch: pitchRatio, direction };
}
