import prisma from '../../config/prisma.js';
import { faceRegistrationRepository } from './face-registration.repository.js';
import {
  EMBEDDING_DIMENSIONS,
  FACE_MATCH_THRESHOLD,
  FACE_MATCH_MAX_DISTANCE,
  LIVENESS_THRESHOLD,
  FACE_REGISTRATION_ACTIONS
} from './face-registration.constants.js';
import {
  encryptData,
  decryptData
} from '../../security/encryption.js';
import * as faceService from '../../services/face.service.js';
import { uploadBase64Image } from '../../config/cloudinary.js';
import { livenessService } from '../attendance-security/attendance-security.service.js';
import { createNotification } from '../notifications/notifications.repository.js';
import { AppError } from '../../utils/response.js';
import { invalidateCache } from '../../middlewares/cache.middleware.js';

export const faceRegistrationService = {
  /**
   * 1. Enroll / Register Employee Face (Direct or Approval Workflow)
   */
  registerFace: async ({
    employeeId,
    companyId,
    photo,
    embedding,
    livenessScore = 0.95,
    challengeId,
    registeredBy,
    role
  }) => {
    console.log('=== FACE REGISTRATION ===');
    console.log('Employee:', employeeId);
    console.log('Role:', role);

    // 1. Verify employee exists and belongs to company
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          include: {
            userRoles: {
              include: { role: true }
            }
          }
        }
      }
    });

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

    // 4. Generate 128-dim normalized embedding with face-api.js from captured photo
    const rawEmbedding = await faceService.generateEmbedding(photo);
    if (!rawEmbedding || !Array.isArray(rawEmbedding) || rawEmbedding.length === 0) {
      throw new AppError('No face detected in the photo. Please ensure your face is clearly visible, well-lit, and facing the camera.', 400);
    }
    
    // 5. Encrypt embedding using AES-256-GCM
    const encryptedEmbedding = encryptData(rawEmbedding);

    // 6. Upload face photo to Cloudinary / storage with fast timeout race
    let photoUrl = employee.photoUrl || photo;
    let photoPublicId = null;

    if (photo && photo.startsWith('data:image')) {
      try {
        const uploadPromise = uploadBase64Image(photo, `ems/${companyId}/faces/${employeeId}`);
        const uploadRes = await Promise.race([
          uploadPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Cloudinary timeout')), 1200))
        ]);
        if (uploadRes?.secure_url) {
          photoUrl = uploadRes.secure_url;
          photoPublicId = uploadRes.public_id;
        }
      } catch (uploadErr) {
        photoUrl = photo;
        // Background async upload if Cloudinary took longer than 1.2s
        uploadBase64Image(photo, `ems/${companyId}/faces/${employeeId}`)
          .then(async (bgRes) => {
            if (bgRes?.secure_url) {
              await prisma.employee.update({
                where: { id: employeeId },
                data: { facePhotoUrl: bgRes.secure_url, facePhotoPublicId: bgRes.public_id }
              }).catch(() => {});
            }
          })
          .catch(() => {});
      }
    }

    // 7. Determine Role & Approval Workflow
    const employeeRole = employee.user?.userRoles?.[0]?.role?.name || 'EMPLOYEE';
    const rolesThatSkipApproval = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER'];

    let isHrOrAdmin = false;
    if (role && rolesThatSkipApproval.includes(role)) {
      isHrOrAdmin = true;
    } else if (registeredBy) {
      const regUser = await prisma.user.findUnique({
        where: { id: registeredBy },
        include: { userRoles: { include: { role: true } } }
      });
      const regUserRoles = regUser?.userRoles?.map(ur => ur.role?.name) || [];
      isHrOrAdmin = regUserRoles.some(r => rolesThatSkipApproval.includes(r));
    }

    const canSkipApproval = isHrOrAdmin || rolesThatSkipApproval.includes(employeeRole);

    if (canSkipApproval) {
      // DIRECT REGISTRATION (no approval needed for admins/managers or when HR registers for someone)
      console.log('Direct registration (no approval needed)');
      const oldEmbedding = employee.faceEmbedding;
      const isUpdate = Boolean(employee.faceEmbedding && employee.faceRegisteredAt);

      const updatedEmployee = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          faceEmbedding: encryptedEmbedding,
          facePhotoUrl: photoUrl,
          facePhotoPublicId: photoPublicId,
          faceRegisteredAt: new Date()
        }
      });

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
          directRegistration: true,
          registeredAt: new Date().toISOString()
        }
      });

      // Invalidate backend caches immediately
      invalidateCache('cache:employees_list', companyId).catch(() => {});
      invalidateCache('cache:employees_detail', companyId).catch(() => {});
      invalidateCache('cache:employees_dash', companyId).catch(() => {});

      return {
        success: true,
        registered: true,
        requiresApproval: false,
        employeeId: updatedEmployee.id,
        employeeCode: updatedEmployee.employeeCode,
        firstName: updatedEmployee.firstName,
        lastName: updatedEmployee.lastName,
        facePhotoUrl: updatedEmployee.facePhotoUrl,
        faceRegisteredAt: updatedEmployee.faceRegisteredAt,
        message: 'Face registered successfully'
      };
    } else {
      // APPROVAL REQUIRED (for employees registering their own face)
      console.log('Approval required for employee');

      const existingRequest = await prisma.faceRegistrationRequest.findFirst({
        where: {
          employeeId,
          status: 'PENDING'
        }
      });

      if (existingRequest) {
        const error = new Error('You already have a pending face registration request');
        error.statusCode = 400;
        error.code = 'PENDING_REQUEST_EXISTS';
        throw error;
      }

      const request = await prisma.faceRegistrationRequest.create({
        data: {
          employeeId,
          companyId,
          pendingPhotoUrl: photoUrl,
          pendingPhotoPublicId: photoPublicId,
          pendingEmbedding: encryptedEmbedding,
          livenessScore: score.toString(),
          requestedBy: registeredBy || employeeId,
          status: 'PENDING'
        }
      });

      try {
        const hrUsers = await prisma.user.findMany({
          where: {
            companyId,
            userRoles: {
              some: {
                role: {
                  name: { in: ['HR_ADMIN', 'HR_MANAGER', 'COMPANY_ADMIN'] }
                }
              }
            }
          }
        });

        for (const hr of hrUsers) {
          await createNotification({
            userId: hr.id,
            title: 'Face Registration Request',
            body: `${employee.firstName} ${employee.lastName} has requested face registration. Please review.`,
            type: 'APPROVAL',
            priority: 'MEDIUM',
            metadata: {
              requestId: request.id,
              employeeId,
              type: 'FACE_REGISTRATION'
            }
          });
        }
      } catch (notifErr) {
        console.error('Failed to dispatch HR notifications:', notifErr.message);
      }

      return {
        success: true,
        registered: false,
        requiresApproval: true,
        requestId: request.id,
        message: 'Face registration request submitted. Waiting for HR approval.'
      };
    }
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

    // Anti-replay verification
    const replayCheck = await faceService.checkAndRecordImageReplay(photo, employeeId, 86400);
    if (!replayCheck.passed) {
      throw new AppError('Replay attack detected. The submitted photo was already used previously.', 400);
    }

    // Generate embedding for probe photo
    const probeVector = await faceService.generateEmbedding(photo);
    if (!probeVector || probeVector.length === 0) {
      throw new AppError('Face not detected in probe photo. Please ensure camera lens is unobstructed.', 400);
    }

    // Compute STRICT Face Comparison
    const comparison = faceService.compareFaces(storedVector, probeVector, FACE_MATCH_MAX_DISTANCE);

    return {
      matched: comparison.passed,
      distance: comparison.distance,
      score: comparison.similarity,
      threshold: comparison.threshold,
      matchPercentage: comparison.matchConfidence,
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
  },

  /**
   * 11. Approve Face Registration Request (HR_ADMIN, HR_MANAGER, COMPANY_ADMIN)
   */
  approveFaceRegistration: async ({ requestId, approvedBy, companyId }) => {
    const request = await prisma.faceRegistrationRequest.findUnique({
      where: { id: requestId },
      include: { employee: true }
    });

    if (!request) {
      throw new AppError('Face registration request not found', 404);
    }

    if (request.companyId !== companyId) {
      throw new AppError('Unauthorized to approve request for this company', 403);
    }

    if (request.status !== 'PENDING') {
      throw new AppError('Request has already been processed', 400);
    }

    // Apply face biometric data to employee record
    const updatedEmployee = await prisma.employee.update({
      where: { id: request.employeeId },
      data: {
        faceEmbedding: request.pendingEmbedding,
        facePhotoUrl: request.pendingPhotoUrl,
        facePhotoPublicId: request.pendingPhotoPublicId,
        faceRegisteredAt: new Date()
      }
    });

    // Update request status to APPROVED
    await prisma.faceRegistrationRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date()
      }
    });

    // Audit log
    await faceRegistrationRepository.createFaceRegistrationLog({
      companyId,
      employeeId: request.employeeId,
      action: FACE_REGISTRATION_ACTIONS.REGISTER,
      photoUrl: request.pendingPhotoUrl,
      livenessScore: request.livenessScore ? Number(request.livenessScore) : null,
      oldEmbedding: null,
      newEmbedding: request.pendingEmbedding,
      registeredBy: approvedBy,
      metadata: {
        requestId,
        approvedBy,
        approvedAt: new Date().toISOString()
      }
    });

    // Notify employee
    if (request.employee?.userId) {
      try {
        await createNotification({
          userId: request.employee.userId,
          title: 'Face Registration Approved',
          body: 'Your face registration has been approved. You can now mark attendance using face recognition.',
          type: 'SYSTEM',
          priority: 'HIGH',
          metadata: {
            requestId,
            type: 'FACE_REGISTRATION_APPROVED'
          }
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr.message);
      }
    }

    return {
      success: true,
      message: 'Face registration approved successfully',
      employeeId: updatedEmployee.id,
      faceRegisteredAt: updatedEmployee.faceRegisteredAt
    };
  },

  /**
   * 12. Reject Face Registration Request
   */
  rejectFaceRegistration: async ({ requestId, rejectedBy, companyId, reason = 'Face photo does not meet quality requirements' }) => {
    const request = await prisma.faceRegistrationRequest.findUnique({
      where: { id: requestId },
      include: { employee: true }
    });

    if (!request || request.companyId !== companyId) {
      throw new AppError('Face registration request not found or access denied', 404);
    }

    if (request.status !== 'PENDING') {
      throw new AppError('Request has already been processed', 400);
    }

    await prisma.faceRegistrationRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        rejectionReason: reason
      }
    });

    if (request.employee?.userId) {
      try {
        await createNotification({
          userId: request.employee.userId,
          title: 'Face Registration Rejected',
          body: `Your face registration was rejected. Reason: ${reason}`,
          type: 'SYSTEM',
          priority: 'HIGH',
          metadata: {
            requestId,
            reason,
            type: 'FACE_REGISTRATION_REJECTED'
          }
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr.message);
      }
    }

    return {
      success: true,
      message: 'Face registration rejected'
    };
  },

  /**
   * 13. List Pending Face Registration Requests
   */
  listPendingRequests: async ({ companyId, status = 'PENDING', pagination = { page: 1, limit: 20 } }) => {
    const where = { companyId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.faceRegistrationRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              email: true,
              department: { select: { id: true, name: true } },
              designation: { select: { id: true, name: true } },
              branch: { select: { id: true, name: true } }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.faceRegistrationRequest.count({ where })
    ]);

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  /**
   * 14. Get Current User / Employee Face Status & Pending Request
   */
  getMyStatus: async ({ employeeId, userId, companyId }) => {
    let emp = null;
    if (employeeId) {
      emp = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          faceEmbedding: true,
          facePhotoUrl: true,
          faceRegisteredAt: true,
          firstName: true,
          lastName: true
        }
      });
    } else if (userId) {
      emp = await prisma.employee.findUnique({
        where: { userId },
        select: {
          id: true,
          faceEmbedding: true,
          facePhotoUrl: true,
          faceRegisteredAt: true,
          firstName: true,
          lastName: true
        }
      });
    }

    if (!emp) {
      return { status: 'NOT_REGISTERED', isRegistered: false };
    }

    if (emp.faceEmbedding && emp.faceRegisteredAt) {
      return {
        status: 'APPROVED',
        isRegistered: true,
        facePhotoUrl: emp.facePhotoUrl,
        faceRegisteredAt: emp.faceRegisteredAt,
        employeeId: emp.id
      };
    }

    const latestRequest = await prisma.faceRegistrationRequest.findFirst({
      where: { employeeId: emp.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestRequest) {
      return {
        status: 'NOT_REGISTERED',
        isRegistered: false,
        employeeId: emp.id
      };
    }

    return {
      status: latestRequest.status,
      isRegistered: false,
      requestId: latestRequest.id,
      employeeId: emp.id,
      pendingPhotoUrl: latestRequest.pendingPhotoUrl,
      rejectionReason: latestRequest.rejectionReason,
      createdAt: latestRequest.createdAt,
      approvedAt: latestRequest.approvedAt
    };
  }
};

export default faceRegistrationService;
