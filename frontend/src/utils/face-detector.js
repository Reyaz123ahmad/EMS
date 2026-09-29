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
 * Validate whether the detected face is centered inside the guide circle/oval and has adequate size
 */
export function checkFaceBounds(box, frameWidth = 640, frameHeight = 480) {
  if (!box) {
    return {
      isInside: false,
      isSizeOk: false,
      isProperlyPositioned: false,
      status: 'NO_FACE',
      message: 'No face detected in camera feed',
      distance: 999,
      radius: 0
    };
  }

  const centerX = frameWidth / 2;
  const centerY = frameHeight / 2;
  // Guide circle radius: approx 38% of smaller dimension (e.g. 182px in 640x480)
  const radius = Math.min(frameWidth, frameHeight) * 0.38;
  const tolerance = radius * 0.15;

  const faceCx = box.x + box.width / 2;
  const faceCy = box.y + box.height / 2;
  const d = Math.hypot(faceCx - centerX, faceCy - centerY);

  // Minimum face size threshold to ensure close proximity
  const MIN_FACE_WIDTH = 110;
  const MIN_FACE_HEIGHT = 110;

  const isSizeOk = box.width >= MIN_FACE_WIDTH && box.height >= MIN_FACE_HEIGHT;
  const isInside = (d + box.width / 2) <= (radius + tolerance) && d <= (radius * 0.65);

  let status = 'ALIGNED';
  let message = 'Face centered';

  if (!isInside) {
    status = 'OUTSIDE_CIRCLE';
    message = 'Move face to the center of the circle';
  } else if (!isSizeOk) {
    status = 'TOO_FAR';
    message = 'Move closer to camera';
  }

  return {
    isInside,
    isSizeOk,
    isProperlyPositioned: isInside && isSizeOk,
    status,
    message,
    distance: d,
    radius,
    faceCenter: { x: faceCx, y: faceCy },
    frameCenter: { x: centerX, y: centerY }
  };
}

/**
 * Detect head pose (Yaw & Pitch)
 * User-Centric:
 * - When user turns head to THEIR RIGHT: userYaw > +0.12, direction = 'RIGHT'
 * - When user turns head to THEIR LEFT: userYaw < -0.12, direction = 'LEFT'
 */
export function detectHeadPose(landmarks) {
  if (!landmarks || landmarks.length < 68) {
    return { yaw: 0, pitch: 0, direction: 'CENTER' };
  }

  const nose = landmarks[30];
  const leftEye = landmarks[36]; // in 2D image coordinates (camera image left, lower x)
  const rightEye = landmarks[45]; // in 2D image coordinates (camera image right, higher x)
  const chin = landmarks[8];
  const noseBridge = landmarks[27];

  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const eyeDistance = Math.abs(rightEye.x - leftEye.x);

  if (eyeDistance === 0) return { yaw: 0, pitch: 0, direction: 'CENTER' };

  // In raw 2D camera image coordinates:
  // - Turning head to user's RIGHT moves nose towards lower X (nose.x < eyeCenterX)
  // - Turning head to user's LEFT moves nose towards higher X (nose.x > eyeCenterX)
  // We compute user-centric yaw:
  const rawImageYaw = (nose.x - eyeCenterX) / eyeDistance;
  const userYaw = -rawImageYaw;

  // Pitch: vertical ratio between eye-nose and nose-chin
  const upperFaceHeight = Math.abs(nose.y - eyeCenterY);
  const lowerFaceHeight = Math.abs(chin.y - nose.y);
  const pitchRatio = lowerFaceHeight === 0 ? 1 : upperFaceHeight / lowerFaceHeight;

  let direction = 'CENTER';
  if (userYaw > 0.12) {
    direction = 'RIGHT'; // User turned head to their right
  } else if (userYaw < -0.12) {
    direction = 'LEFT'; // User turned head to their left
  } else if (pitchRatio > 1.35 || (noseBridge && nose.y - noseBridge.y < 15)) {
    direction = 'UP';
  } else if (pitchRatio < 0.7) {
    direction = 'DOWN';
  }

  return { yaw: userYaw, rawImageYaw, pitch: pitchRatio, direction };
}
