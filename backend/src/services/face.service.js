import * as faceapi from 'face-api.js';
import canvas from 'canvas';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import redis from '../config/redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Monkey-patch face-api environment with native Canvas
const { Canvas, Image, ImageData, loadImage } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_PATH = path.join(__dirname, '../../models/face');

let modelsLoaded = false;
let customEmbeddingProvider = null;

export const STRICT_MAX_DISTANCE = 0.50; // Strict Euclidean distance limit (< 0.50)
export const STRICT_MIN_SIMILARITY = 0.875; // Corresponding minimum cosine similarity

export function setEmbeddingProvider(fn) {
  customEmbeddingProvider = fn;
}

export function resetEmbeddingProvider() {
  customEmbeddingProvider = null;
}

/**
 * Load all neural network weights from disk
 */
export async function loadModels() {
  if (modelsLoaded) return;

  console.log('[FACE_SERVICE] Loading face-api neural models from:', MODEL_PATH);
  try {
    await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceExpressionNet.loadFromDisk(MODEL_PATH);
    modelsLoaded = true;
    console.log('[FACE_SERVICE] Face recognition models loaded successfully');
  } catch (err) {
    console.error('[FACE_SERVICE] Failed to load face-api models from disk:', err);
    throw err;
  }
}

/**
 * Convert base64 data to canvas Image
 */
async function getCanvasImage(base64Photo) {
  if (!base64Photo) return null;
  const base64Data = base64Photo.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  return await loadImage(buffer);
}

// In-memory anti-replay cache fallback
const inMemoryReplayStore = new Map();

/**
 * Anti-Replay: Verify and record photo hash within 24h window
 * @param {string} photoBase64
 * @param {string} employeeId
 * @param {number} windowSeconds
 */
export async function checkAndRecordImageReplay(photoBase64, employeeId = 'anonymous', windowSeconds = 86400) {
  if (!photoBase64) return { passed: true, isReplay: false, hash: null };
  const cleanBase64 = photoBase64.replace(/^data:image\/\w+;base64,/, '').trim();
  const imageHash = crypto.createHash('sha256').update(cleanBase64).digest('hex');
  const key = `face:replay:${imageHash}`;

  if (redis) {
    try {
      const existing = await redis.get(key);
      if (existing) {
        return { passed: false, isReplay: true, reason: 'REPLAY_DETECTED', hash: imageHash, originalUser: existing };
      }
      await redis.set(key, employeeId, 'EX', windowSeconds);
      return { passed: true, isReplay: false, hash: imageHash };
    } catch {
      // Fall through to memory store on redis connection issues
    }
  }

  const now = Date.now();
  const existing = inMemoryReplayStore.get(imageHash);
  if (existing && (now - existing.timestamp) < windowSeconds * 1000) {
    return { passed: false, isReplay: true, reason: 'REPLAY_DETECTED', hash: imageHash, originalUser: existing.employeeId };
  }

  inMemoryReplayStore.set(imageHash, { employeeId, timestamp: now });
  return { passed: true, isReplay: false, hash: imageHash };
}

/**
 * Detect face and generate 128-dim descriptor embedding with multi-face rejection
 */
export async function generateEmbedding(base64Photo) {
  if (customEmbeddingProvider) {
    return await customEmbeddingProvider(base64Photo);
  }
  await loadModels();
  if (!base64Photo) return null;

  try {
    const img = await getCanvasImage(base64Photo);
    if (!img) return null;

    // Detect all faces in frame to ensure single-face constraint
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length > 1) {
      const err = new Error('MULTIPLE_FACES_DETECTED: Multiple faces found in the frame. Please ensure only you are visible in the camera.');
      err.code = 'MULTIPLE_FACES_DETECTED';
      throw err;
    }

    if (detections.length === 1) {
      return Array.from(detections[0].descriptor);
    }

    // Fallback: Check standard 224 input size
    const fallbackDetections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (fallbackDetections.length > 1) {
      const err = new Error('MULTIPLE_FACES_DETECTED: Multiple faces found in the frame. Please ensure only you are visible in the camera.');
      err.code = 'MULTIPLE_FACES_DETECTED';
      throw err;
    }

    if (fallbackDetections.length === 1) {
      return Array.from(fallbackDetections[0].descriptor);
    }

    return null;
  } catch (err) {
    if (err.code === 'MULTIPLE_FACES_DETECTED') {
      throw err;
    }
    console.error('[FACE_SERVICE] Error generating embedding:', err);
    return null;
  }
}

/**
 * Detect face + return landmarks & bounding box
 */
export async function detectFaceWithLandmarks(base64Photo) {
  await loadModels();
  if (!base64Photo) return null;

  try {
    const img = await getCanvasImage(base64Photo);
    if (!img) return null;

    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length > 1) {
      const err = new Error('MULTIPLE_FACES_DETECTED: Multiple faces found in the frame.');
      err.code = 'MULTIPLE_FACES_DETECTED';
      throw err;
    }

    if (detections.length === 0) return null;
    const detection = detections[0];

    return {
      embedding: Array.from(detection.descriptor),
      landmarks: detection.landmarks.positions.map((p) => ({ x: p.x, y: p.y })),
      box: detection.detection.box,
      score: detection.detection.score
    };
  } catch (err) {
    if (err.code === 'MULTIPLE_FACES_DETECTED') {
      throw err;
    }
    console.error('[FACE_SERVICE] Error detecting face landmarks:', err);
    return null;
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error('Invalid embeddings for comparison: length mismatch or missing vector');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    throw new Error('Zero vector in embedding comparison');
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Euclidean distance
 */
export function euclideanDistance(a, b) {
  if (a.length !== b.length) {
    throw new Error('Embedding length mismatch');
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

/**
 * Compare two faces with STRICT Euclidean distance threshold (< 0.50)
 * Standard face-api.js distance < 0.60 is loose; for high-security attendance, STRICT distance < 0.50 is enforced.
 */
export function compareFaces(embedding1, embedding2, maxDistance = STRICT_MAX_DISTANCE) {
  if (!embedding1 || !embedding2) {
    return {
      passed: false,
      distance: 999,
      similarity: 0,
      threshold: maxDistance,
      matchConfidence: '0%',
      reason: 'MISSING_EMBEDDING'
    };
  }

  const vecA = Array.isArray(embedding1) ? embedding1 : Array.from(embedding1);
  const vecB = Array.isArray(embedding2) ? embedding2 : Array.from(embedding2);

  if (vecA.length !== vecB.length || vecA.length === 0) {
    return {
      passed: false,
      distance: 999,
      similarity: 0,
      threshold: maxDistance,
      matchConfidence: '0%',
      reason: 'EMBEDDING_LENGTH_MISMATCH'
    };
  }

  const distance = euclideanDistance(vecA, vecB);
  const similarity = cosineSimilarity(vecA, vecB);

  // STRICT RULE: Must satisfy Euclidean distance < maxDistance (0.50)
  const effectiveThreshold = typeof maxDistance === 'number' && maxDistance <= 0.6 ? maxDistance : STRICT_MAX_DISTANCE;
  const passed = distance < effectiveThreshold;

  // Compute confidence percentage
  const confidencePct = Math.max(0, Math.min(100, Math.round((1 - (distance / 1.0)) * 100)));

  return {
    passed,
    distance: Math.round(distance * 10000) / 10000,
    similarity: Math.round(similarity * 10000) / 10000,
    threshold: effectiveThreshold,
    matchConfidence: `${confidencePct}%`,
    reason: passed ? null : `Face distance ${distance.toFixed(3)} exceeds strict threshold ${effectiveThreshold.toFixed(2)}`
  };
}

/**
 * Calculate Eye Aspect Ratio (EAR) for blink detection
 */
function calculateEAR(eye) {
  if (!eye || eye.length < 6) return 0.3;
  const v1 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
  const v2 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
  const h = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
  if (h === 0) return 0.3;
  return (v1 + v2) / (2 * h);
}

/**
 * Detect blink from 68 landmarks
 */
export function detectBlink(landmarks) {
  if (!landmarks || landmarks.length < 48) {
    return { isBlinking: false, ear: 0.3 };
  }

  const leftEye = landmarks.slice(36, 42);
  const rightEye = landmarks.slice(42, 48);

  const leftEAR = calculateEAR(leftEye);
  const rightEAR = calculateEAR(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2;

  return {
    isBlinking: avgEAR < 0.22,
    ear: avgEAR
  };
}

/**
 * Detect head pose direction from 68 facial landmarks
 */
export function detectHeadPose(landmarks) {
  if (!landmarks || landmarks.length < 46) {
    return { yaw: 0, direction: 'CENTER' };
  }

  const nose = landmarks[30];
  const leftEye = landmarks[36];
  const rightEye = landmarks[45];

  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2
  };

  const horizontalOffset = nose.x - eyeCenter.x;
  const eyeDistance = Math.abs(rightEye.x - leftEye.x) || 1;
  const yaw = horizontalOffset / eyeDistance;

  let direction = 'CENTER';
  if (yaw < -0.15) direction = 'LEFT';
  else if (yaw > 0.15) direction = 'RIGHT';

  return { yaw, direction };
}

export default {
  loadModels,
  generateEmbedding,
  detectFaceWithLandmarks,
  cosineSimilarity,
  euclideanDistance,
  compareFaces,
  detectBlink,
  detectHeadPose
};
