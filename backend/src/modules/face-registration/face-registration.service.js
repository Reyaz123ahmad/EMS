import { faceRegistrationRepository } from './face-registration.repository.js';
import {
  EMBEDDING_DIMENSIONS,
  FACE_MATCH_THRESHOLD,
  LIVENESS_THRESHOLD,
  FACE_REGISTRATION_ACTIONS
} from './face-registration.constants.js';
import {
  encryptData,
  decryptData,
  generateFaceEmbedding,
  cosineSimilarity
} from '../../security/encryption.js';
import { uploadBase64Image } from '../../config/cloudinary.js';
import { livenessService } from '../attendance-security/attendance-security.service.js';
import { AppError } from '../../utils/response.js';

export const faceRegistrationService = {
  /**
   * 1. Enroll / Register Employee Face
   */
  registerFace: async ({
    employeeId,
    companyId,
    photo,
    livenessScore = 0.95,
    challengeId,
    registeredBy
  }) => {
    // 1. Verify employee exists and belongs to company
    const employee = await faceRegistrationRepository.findEmployeeWithFace(employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new AppError('Employee record not found or access denied', 404);
    }

    // 2. Validate Liveness Score
    const score = Number(livenessScore);
    if (score < LIVENESS_THRESHOLD) {
      throw new AppError(`Liveness verification failed. Score ${score} is below threshold ${LIVENESS_THRESHOLD}`, 400);
    }

    // 3. Validate interactive challenge if challengeId provided
    if (challengeId) {
      try {
        await livenessService.verifyChallenge(employeeId, challengeId, score, photo);
      } catch (chalErr) {
        throw new AppError(chalErr.message, 400);
      }
    }

    // 4. Generate 512-dim normalized embedding
    const rawEmbedding = generateFaceEmbedding(photo);
    if (!rawEmbedding || rawEmbedding.length === 0) {
      throw new AppError('No face detected in photo. Please ensure clear lighting and centered face.', 400);
    }
    
    // 5. Encrypt embedding using AES-256-GCM
    const encryptedEmbedding = encryptData(rawEmbedding);

    // 6. Upload face photo to Cloudinary
    let photoUrl = employee.photoUrl || photo;
    let photoPublicId = null;

    if (photo && photo.startsWith('data:image')) {
      try {
        const uploadRes = await uploadBase64Image(photo, `ems/${companyId}/faces/${employeeId}`);
        if (uploadRes?.secure_url) {
          photoUrl = uploadRes.secure_url;
          photoPublicId = uploadRes.public_id;
        }
      } catch (uploadErr) {
        // Fallback to existing or direct string if offline / mock
        photoUrl = photo;
      }
    }

    const oldEmbedding = employee.faceEmbedding;
    const isUpdate = Boolean(employee.faceEmbedding && employee.faceRegisteredAt);

    // 7. Update Employee model with encrypted embedding & photo
    const updatedEmployee = await faceRegistrationRepository.updateEmployeeFace(employeeId, {
      faceEmbedding: encryptedEmbedding,
      facePhotoUrl: photoUrl,
      facePhotoPublicId: photoPublicId,
      faceRegisteredAt: new Date()
    });

    // 8. Log registration action
    await faceRegistrationRepository.createFaceRegistrationLog({
      companyId,
      employeeId,
      action: isUpdate ? FACE_REGISTRATION_ACTIONS.UPDATE : FACE_REGISTRATION_ACTIONS.REGISTER,
      photoUrl,
      livenessScore: score,
      oldEmbedding,
      newEmbedding: encryptedEmbedding,
      registeredBy,
      metadata: {
        dimensions: EMBEDDING_DIMENSIONS,
        challengeId: challengeId || null,
        registeredAt: new Date().toISOString()
      }
    });

    return {
      registered: true,
      employeeId: updatedEmployee.id,
      employeeCode: updatedEmployee.employeeCode,
      firstName: updatedEmployee.firstName,
      lastName: updatedEmployee.lastName,
      facePhotoUrl: updatedEmployee.facePhotoUrl,
      faceRegisteredAt: updatedEmployee.faceRegisteredAt,
      message: `Face biometric successfully ${isUpdate ? 'updated' : 'enrolled'}.`
    };
  },

  /**
   * 2. Update Enrolled Face
   */
  updateFace: async (payload) => {
    return faceRegistrationService.registerFace(payload);
  },

  /**
   * 3. Delete / Reset Enrolled Face
   */
  deleteFace: async ({ employeeId, companyId, reason, deletedBy }) => {
    const employee = await faceRegistrationRepository.findEmployeeWithFace(employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new AppError('Employee record not found', 404);
    }

    const oldEmbedding = employee.faceEmbedding;

    await faceRegistrationRepository.deleteEmployeeFace(employeeId);

    await faceRegistrationRepository.createFaceRegistrationLog({
      companyId,
      employeeId,
      action: FACE_REGISTRATION_ACTIONS.DELETE,
      photoUrl: employee.facePhotoUrl,
      oldEmbedding,
      newEmbedding: null,
      registeredBy: deletedBy,
      reason: reason || 'Administrative reset'
    });

    return {
      deleted: true,
      employeeId,
      message: 'Face biometric data successfully reset.'
    };
  },

  /**
   * 4. Verify Live Photo Against Stored Face Embedding
   */
  verifyFace: async ({ employeeId, companyId, photo }) => {
    const employee = await faceRegistrationRepository.findEmployeeWithFace(employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new AppError('Employee record not found', 404);
    }

    if (!employee.faceEmbedding) {
      throw new AppError('Face is not enrolled for this employee. Please register face first.', 400);
    }

    // Decrypt stored embedding vector
    const storedVector = decryptData(employee.faceEmbedding, true);
    if (!Array.isArray(storedVector)) {
      throw new AppError('Stored facial biometric record is corrupt or invalid format', 500);
    }

    // Generate embedding for probe photo
    const probeVector = generateFaceEmbedding(photo);
    if (!probeVector || probeVector.length === 0) {
      throw new AppError('Face not detected in probe photo. Please ensure camera lens is unobstructed.', 400);
    }

    // Compute Cosine Similarity
    const score = cosineSimilarity(storedVector, probeVector);
    const matched = score >= FACE_MATCH_THRESHOLD;

    return {
      matched,
      score,
      threshold: FACE_MATCH_THRESHOLD,
      matchPercentage: `${Math.round(score * 100)}%`,
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: `${employee.firstName} ${employee.lastName}`
      }
    };
  },

  /**
   * 5. Get Face Enrollment Status
   */
  getFaceStatus: async (employeeId, companyId) => {
    const employee = await faceRegistrationRepository.findEmployeeWithFace(employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new AppError('Employee not found', 404);
    }

    const isRegistered = Boolean(employee.faceEmbedding && employee.faceRegisteredAt);

    return {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      name: `${employee.firstName} ${employee.lastName}`,
      registered: isRegistered,
      faceRegisteredAt: employee.faceRegisteredAt,
      facePhotoUrl: employee.facePhotoUrl || employee.photoUrl || null
    };
  },

  /**
   * 6. List Employees With Face Registered
   */
  listEmployeesWithFace: async (companyId, filters, pagination) => {
    return faceRegistrationRepository.findEmployeesWithFace(companyId, filters, pagination);
  },

  /**
   * 7. List Employees Without Face Registered (Pending)
   */
  listEmployeesWithoutFace: async (companyId, filters, pagination) => {
    return faceRegistrationRepository.findEmployeesWithoutFace(companyId, filters, pagination);
  },

  /**
   * 8. Bulk Register Faces for Migration / Batch Setup
   */
  bulkRegisterFace: async ({ employeeIds, companyId, defaultPhoto, registeredBy }) => {
    const results = [];
    for (const id of employeeIds) {
      try {
        const photo = defaultPhoto || `seed_face_photo_${id}_${Date.now()}`;
        const res = await faceRegistrationService.registerFace({
          employeeId: id,
          companyId,
          photo,
          livenessScore: 0.96,
          registeredBy
        });
        results.push({ employeeId: id, status: 'SUCCESS', result: res });
      } catch (err) {
        results.push({ employeeId: id, status: 'FAILED', error: err.message });
      }
    }

    return {
      total: employeeIds.length,
      successful: results.filter((r) => r.status === 'SUCCESS').length,
      failed: results.filter((r) => r.status === 'FAILED').length,
      details: results
    };
  },

  /**
   * 9. Face Registration Dashboard Stats
   */
  getFaceRegistrationStats: async (companyId) => {
    return faceRegistrationRepository.countFaceRegistrationStats(companyId);
  },

  /**
   * 10. Export Encrypted Face Embeddings for Backup
   */
  exportFaceEmbeddings: async (companyId) => {
    const records = await faceRegistrationRepository.findAllFaceEmbeddings(companyId);
    return {
      companyId,
      count: records.length,
      exportedAt: new Date().toISOString(),
      embeddings: records.map((r) => ({
        employeeId: r.id,
        employeeCode: r.employeeCode,
        name: `${r.firstName} ${r.lastName}`,
        encryptedEmbedding: r.faceEmbedding,
        registeredAt: r.faceRegisteredAt
      }))
    };
  }
};

export default faceRegistrationService;
