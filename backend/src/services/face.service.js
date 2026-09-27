import * as faceapi from 'face-api.js';
import canvas from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Monkey-patch face-api environment with native Canvas
const { Canvas, Image, ImageData, loadImage } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_PATH = path.join(__dirname, '../../models/face');

let modelsLoaded = false;
let customEmbeddingProvider = null;

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

/**
 * Detect face and generate 128-dim descriptor embedding
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

    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      // Fallback: Check standard 224 input size
      const fallbackDetection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!fallbackDetection) return null;
      return Array.from(fallbackDetection.descriptor);
    }

    return Array.from(detection.descriptor);
  } catch (err) {
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

    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;

    return {
      embedding: Array.from(detection.descriptor),
      landmarks: detection.landmarks.positions.map((p) => ({ x: p.x, y: p.y })),
      box: detection.detection.box,
      score: detection.detection.score
    };
  } catch (err) {
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
 * Compare two faces with strict threshold
 */
export function compareFaces(embedding1, embedding2, threshold = 0.75) {
  const similarity = cosineSimilarity(embedding1, embedding2);
  const distance = euclideanDistance(embedding1, embedding2);
  const passed = similarity >= threshold;

  return {
    similarity,
    distance,
    passed,
    threshold,
    matchConfidence: `${Math.round(similarity * 100)}%`
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
