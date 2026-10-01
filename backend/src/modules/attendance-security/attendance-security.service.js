import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import attendanceSecurityRepository from './attendance-security.repository.js';
import { decryptData } from '../../security/encryption.js';
import * as faceService from '../../services/face.service.js';
import {
  FRAUD_TYPES,
  SEVERITY,
  LIVENESS_CHALLENGE_TYPES,
  GEO_CONSTANTS,
  SECURITY_THRESHOLDS
} from './attendance-security.constants.js';

/**
 * 1. Geo-Fencing & Location Attestation Service
 */
export const geoFencingService = {
  /**
   * Calculate great-circle distance between two points using Haversine formula
   * @param {number} lat1 
   * @param {number} lon1 
   * @param {number} lat2 
   * @param {number} lon2 
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
    const R = GEO_CONSTANTS.EARTH_RADIUS_METERS;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // 2 decimal precision
  },

  /**
   * Validate GPS coordinates against branch boundary & attestation rules
   */
  async validateLocation({
    latitude,
    longitude,
    accuracy = 10,
    isMockLocation = false,
    ipAddress,
    branch,
    companyId,
    employeeId
  }) {
    const issues = [];
    let distance = 0;
    const branchLat = branch?.latitude ? Number(branch.latitude) : null;
    const branchLng = branch?.longitude ? Number(branch.longitude) : null;
    const radius = branch?.geofenceRadius || GEO_CONSTANTS.DEFAULT_RADIUS;

    // 1. Mock GPS Detection
    if (isMockLocation) {
      issues.push({
        type: FRAUD_TYPES.MOCK_LOCATION,
        severity: SEVERITY.CRITICAL,
        description: 'Mock location app or fake GPS provider detected on device.'
      });
    }

    // 2. Low Accuracy GPS check (> 50 meters)
    if (accuracy > GEO_CONSTANTS.DEFAULT_MAX_ACCURACY) {
      issues.push({
        type: FRAUD_TYPES.GPS_ACCURACY_LOW,
        severity: SEVERITY.MEDIUM,
        description: `GPS signal accuracy too weak (${accuracy}m > ${GEO_CONSTANTS.DEFAULT_MAX_ACCURACY}m max permitted).`
      });
    }

    // 3. Geofence Radius Verification
    if (branch && branchLat !== null && branchLng !== null && branch.isGeofenceActive !== false) {
      distance = this.calculateDistance(latitude, longitude, branchLat, branchLng);

      if (distance > radius) {
        issues.push({
          type: FRAUD_TYPES.OUT_OF_GEOFENCE,
          severity: SEVERITY.HIGH,
          description: `Punch location is ${distance}m away from ${branch.name} (permitted radius: ${radius}m).`,
          distance
        });
      }
    }

    // Record fraud signals asynchronously in background if issues detected
    if (issues.length > 0 && companyId) {
      Promise.allSettled(
        issues.map((issue) =>
          attendanceSecurityRepository.createFraudSignal({
            companyId,
            employeeId,
            signalType: issue.type,
            severity: issue.severity,
            description: issue.description,
            employeeLat: latitude,
            employeeLng: longitude,
            expectedLat: branchLat,
            expectedLng: branchLng,
            distanceMeters: distance || null,
            metadata: { accuracy, isMockLocation, ipAddress }
          })
        )
      ).catch(() => {});
    }

    const passed = issues.length === 0;
    return {
      passed,
      distance,
      radius,
      issues,
      reason: passed ? null : issues.map((i) => i.description).join(' | ')
    };
  }
};

/**
 * 2. Liveness Challenge & Verification Service
 */
export const livenessService = {
  /**
   * Helper to resolve an identifier (userId, employeeId) to an Employee record
   */
  async resolveEmployee(identifier) {
    if (!identifier) return null;

    // 1. Check if identifier is already an Employee ID
    let employee = await prisma.employee.findUnique({
      where: { id: identifier },
      include: { user: true }
    });
    if (employee) return employee;

    // 2. Check if identifier is a User ID
    employee = await prisma.employee.findUnique({
      where: { userId: identifier },
      include: { user: true }
    });
    if (employee) return employee;

    // 3. Fallback: Find user and auto-create employee profile if user has companyId
    const user = await prisma.user.findUnique({
      where: { id: identifier },
      include: { employee: true }
    });
    if (user?.employee) return user.employee;

    if (user && user.companyId) {
      const count = await prisma.employee.count({ where: { companyId: user.companyId } });
      const employeeCode = `EMP-${String(count + 1).padStart(4, '0')}`;
      const nameParts = (user.email.split('@')[0] || 'User').split('.');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts[1] || '';

      return await prisma.employee.create({
        data: {
          companyId: user.companyId,
          userId: user.id,
          employeeCode,
          firstName,
          lastName,
          email: user.email,
          phone: user.phone,
          joiningDate: new Date(),
          employmentType: 'FULL_TIME',
          status: 'ACTIVE'
        }
      });
    }

    return null;
  },

  /**
   * Create a randomized interactive challenge
   */
  async createChallenge(identifier) {
    const employee = await this.resolveEmployee(identifier);
    if (!employee) {
      const error = new Error('Employee record not found. Please contact HR to set up your profile.');
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    const challengeTypes = Object.values(LIVENESS_CHALLENGE_TYPES);
    const randomIndex = crypto.randomInt(0, challengeTypes.length);
    const challengeType = challengeTypes[randomIndex];

    const expiresAt = new Date(Date.now() + SECURITY_THRESHOLDS.CHALLENGE_EXPIRY_SECONDS * 1000);

    const challenge = await attendanceSecurityRepository.createLivenessChallenge({
      employeeId: employee.id, // ✅ ALWAYS use verified Employee ID
      challengeType,
      challengeData: {
        instructions: this.getInstructions(challengeType),
        timestamp: Date.now()
      },
      expiresAt
    });

    return {
      challengeId: challenge.id,
      challengeType: challenge.challengeType,
      instructions: this.getInstructions(challengeType),
      expiresAt: challenge.expiresAt
    };
  },

  getInstructions(type) {
    const instructionMap = {
      BLINK: 'Blink your eyes twice naturally',
      TURN_HEAD_LEFT: 'Slowly turn your head to the left',
      TURN_HEAD_RIGHT: 'Slowly turn your head to the right',
      SMILE: 'Smile gently at the camera',
      NOD: 'Nod your head up and down'
    };
    return instructionMap[type] || 'Look straight into the camera';
  },

  /**
   * Verify challenge response and score
   */
  async verifyChallenge(identifier, challengeId, livenessScore, imageData) {
    const employee = await this.resolveEmployee(identifier);
    if (!employee) {
      const error = new Error('Employee record not found. Please contact HR to set up your profile.');
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    const challenge = await attendanceSecurityRepository.findActiveLivenessChallenge(challengeId);
    if (!challenge) {
      throw new Error('Liveness challenge not found or expired.');
    }

    if (new Date() > new Date(challenge.expiresAt)) {
      throw new Error('Liveness challenge has expired. Please request a new challenge.');
    }

    const score = Number(livenessScore);
    const isLive = score >= SECURITY_THRESHOLDS.LIVENESS_SCORE_MIN;

    // Mark challenge as verified
    await attendanceSecurityRepository.updateLivenessChallenge(challengeId, { verified: true });

    // Store verification log using verified Employee.id
    const verification = await attendanceSecurityRepository.createLivenessVerification({
      employeeId: employee.id, // ✅ ALWAYS use valid Employee ID
      livenessScore: score,
      isLive,
      challengeType: challenge.challengeType,
      challengePassed: isLive,
      photoUrl: typeof imageData === 'string' ? imageData : imageData?.photoUrl || null,
      metadata: { challengeId }
    });

    return {
      passed: isLive,
      score,
      challengeType: challenge.challengeType,
      verificationId: verification.id
    };
  }
};

/**
 * 3. Face Biometric Matcher Service
 */
export const faceMatchService = {
  /**
   * Compare photo with enrolled facial embedding vector using cosine similarity
   */
  async matchFace(employee, photoBase64) {
    if (!employee) {
      return { passed: false, score: 0, reason: 'Employee not found' };
    }

    if (!employee.faceRegisteredAt || !employee.faceEmbedding) {
      return {
        passed: false,
        score: 0,
        isNewRegistration: true,
        reason: 'Face enrollment pending. Please enroll face first.'
      };
    }

    try {
      // 1. Decrypt registered embedding
      let registeredEmbedding = null;
      if (typeof employee.faceEmbedding === 'string') {
        registeredEmbedding = decryptData(employee.faceEmbedding, true);
      } else if (Array.isArray(employee.faceEmbedding)) {
        registeredEmbedding = employee.faceEmbedding;
      }

      if (!Array.isArray(registeredEmbedding) || registeredEmbedding.length === 0) {
        return { passed: false, score: 0, distance: 999, reason: 'Corrupt or unreadable enrolled face template' };
      }

      // 2. Anti-Replay Check (24h SHA-256 window)
      const replayCheck = await faceService.checkAndRecordImageReplay(photoBase64, employee.id);
      if (replayCheck.isReplay) {
        await attendanceSecurityRepository.createFraudSignal({
          companyId: employee.companyId,
          employeeId: employee.id,
          signalType: FRAUD_TYPES.PROXY_PUNCH || 'PROXY_PUNCH',
          severity: SEVERITY.CRITICAL || 'CRITICAL',
          description: 'Replay attack detected: identical photo hash submitted within 24h window.',
          metadata: { imageHash: replayCheck.hash, type: 'REPLAY_ATTACK' }
        }).catch(() => {});

        return {
          passed: false,
          score: 0,
          distance: 999,
          reason: 'REPLAY_DETECTED: Duplicate image submitted. Live camera capture required.',
          isReplay: true
        };
      }

      // 3. Generate live probe embedding with multi-face detection
      let liveEmbedding;
      try {
        liveEmbedding = await faceService.generateEmbedding(photoBase64);
      } catch (err) {
        if (err.code === 'MULTIPLE_FACES_DETECTED') {
          return { passed: false, score: 0, distance: 999, reason: err.message, code: 'MULTIPLE_FACES_DETECTED' };
        }
        return { passed: false, score: 0, distance: 999, reason: err.message };
      }

      if (!liveEmbedding || liveEmbedding.length === 0) {
        return { passed: false, score: 0, distance: 999, reason: 'No face detected in live camera frame' };
      }

      // 4. Compute STRICT Euclidean Distance comparison (< 0.50)
      const maxDistance = SECURITY_THRESHOLDS.FACE_MAX_DISTANCE || 0.50;
      const comparison = faceService.compareFaces(registeredEmbedding, liveEmbedding, maxDistance);

      console.log(`[FACE_MATCH] Employee: ${employee.id} | Distance: ${comparison.distance} | MaxAllowed: ${maxDistance} | Result: ${comparison.passed ? 'MATCH' : 'MISMATCH'}`);

      // 5. Asynchronous background audit and fraud signal logging (non-blocking)
      Promise.allSettled([
        !comparison.passed
          ? attendanceSecurityRepository.createFraudSignal({
              companyId: employee.companyId,
              employeeId: employee.id,
              signalType: FRAUD_TYPES.FACE_MISMATCH || 'FACE_MISMATCH',
              severity: SEVERITY.HIGH || 'HIGH',
              description: `Face verification failed: Distance ${comparison.distance} exceeds strict threshold ${maxDistance}`,
              metadata: {
                distance: comparison.distance,
                similarity: comparison.similarity,
                threshold: maxDistance,
                matchConfidence: comparison.matchConfidence,
                imageHash: replayCheck.hash
              }
            })
          : Promise.resolve(),
        prisma.securityEvent.create({
          data: {
            userId: employee.userId || null,
            companyId: employee.companyId,
            eventType: comparison.passed ? 'FACE_MATCH_SUCCESS' : 'FACE_MATCH_FAILED',
            severity: comparison.passed ? 'LOW' : 'HIGH',
            description: comparison.passed ? 'Face verified successfully' : 'Face mismatch detected',
            metadata: {
              employeeId: employee.id,
              distance: comparison.distance,
              similarity: comparison.similarity,
              threshold: maxDistance,
              result: comparison.passed ? 'MATCH' : 'NO_MATCH',
              imageHash: replayCheck.hash,
              timestamp: new Date().toISOString()
            }
          }
        })
      ]).catch(() => {});

      return {
        passed: comparison.passed,
        score: comparison.similarity,
        distance: comparison.distance,
        threshold: maxDistance,
        matchConfidence: comparison.matchConfidence,
        reason: comparison.passed ? null : `Face mismatch (${comparison.matchConfidence} similarity | distance ${comparison.distance} exceeds ${maxDistance})`
      };
    } catch (err) {
      console.error('[FACE_MATCH_ERROR]', err);
      return { passed: false, score: 0, distance: 999, reason: err.message };
    }
  }
};

/**
 * 4. Fraud Detection & Incident Review Service
 */
export const fraudDetectionService = {
  async listFraudSignals(companyId, filters, pagination) {
    return attendanceSecurityRepository.findFraudSignals(companyId, filters, pagination);
  },

  async reviewSignal(id, reviewedBy, notes, actionTaken = 'RESOLVED') {
    return attendanceSecurityRepository.updateFraudSignal(id, {
      reviewed: true,
      reviewedBy,
      reviewedAt: new Date(),
      metadata: {
        notes,
        actionTaken,
        reviewedAt: new Date().toISOString()
      }
    });
  },

  async getFraudStats(companyId, dateRange) {
    return attendanceSecurityRepository.getFraudStats(companyId, dateRange);
  }
};

export default {
  geoFencingService,
  livenessService,
  faceMatchService,
  fraudDetectionService
};
