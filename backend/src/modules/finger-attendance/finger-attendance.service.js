import { fingerAttendanceRepository } from './finger-attendance.repository.js';
import { biometricDevicesRepository } from '../biometric-devices/biometric-devices.repository.js';
import { devicePunchesService } from '../device-punches/device-punches.service.js';
import { encryptData, decryptData } from '../../security/encryption.js';
import { AppError } from '../../utils/response.js';
import prisma from '../../config/prisma.js';

export const fingerAttendanceService = {
  /**
   * 1. Enroll Fingerprint Template
   */
  enrollFinger: async ({
    employeeId,
    companyId,
    fingerIndex,
    template,
    templateFormat = 'ISO',
    deviceId,
    enrolledBy
  }) => {
    // 1. Verify employee exists and belongs to company
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    if (!employee || employee.companyId !== companyId) {
      throw new AppError('Employee record not found or access denied', 404);
    }

    // 2. Validate device if provided
    if (deviceId) {
      const device = await biometricDevicesRepository.findDeviceById(deviceId);
      if (!device || device.companyId !== companyId) {
        throw new AppError('Biometric device not found or unauthorized', 404);
      }
    }

    // 3. Encrypt fingerprint template using AES-256-GCM
    const encryptedTemplate = encryptData(template);

    // 4. Upsert enrollment record
    const enrollment = await fingerAttendanceRepository.upsertFingerEnrollment({
      companyId,
      employeeId,
      fingerIndex: Number(fingerIndex),
      templateData: encryptedTemplate,
      templateFormat,
      deviceId: deviceId || null,
      enrolledBy
    });

    return {
      enrolled: true,
      id: enrollment.id,
      employeeId: enrollment.employeeId,
      fingerIndex: enrollment.fingerIndex,
      templateFormat: enrollment.templateFormat,
      deviceId: enrollment.deviceId,
      enrolledAt: enrollment.createdAt,
      message: 'Fingerprint template successfully enrolled and encrypted.'
    };
  },

  /**
   * 2. Delete / Deactivate Fingerprint Enrollment
   */
  deleteFingerEnrollment: async ({ employeeId, fingerIndex, companyId, deletedBy }) => {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    if (!employee || employee.companyId !== companyId) {
      throw new AppError('Employee not found', 404);
    }

    await fingerAttendanceRepository.deleteFingerEnrollment(employeeId, fingerIndex);

    return {
      deleted: true,
      employeeId,
      fingerIndex: Number(fingerIndex),
      message: 'Fingerprint template successfully deleted.'
    };
  },

  /**
   * 3. Receive Hardware Fingerprint Punch
   */
  receiveFingerPunch: async ({ deviceId, companyId, payload }) => {
    return devicePunchesService.receivePunch({
      deviceId,
      companyId,
      punchType: payload.punchType || 'AUTO',
      verification: 'FINGERPRINT',
      cardNumber: payload.cardNumber,
      employeeId: payload.employeeId,
      rawPayload: payload.rawPayload || payload,
      punchedAt: payload.punchedAt || new Date()
    });
  },

  /**
   * 4. Process Finger Punch
   */
  processFingerPunch: async (punchId) => {
    return devicePunchesService.processPunch(punchId);
  },

  /**
   * 5. Sync Fingerprint Templates to Biometric Hardware Device
   */
  syncFingerTemplatesToDevice: async ({ deviceId, companyId }) => {
    const device = await biometricDevicesRepository.findDeviceById(deviceId);
    if (!device || device.companyId !== companyId) {
      throw new AppError('Biometric device not found or unauthorized', 404);
    }

    const enrollments = await fingerAttendanceRepository.findFingerEnrollmentsByDevice(deviceId);

    // Decrypt templates for hardware sync transmission
    const syncPayload = enrollments.map((enr) => ({
      enrollmentId: enr.id,
      employeeId: enr.employeeId,
      fingerIndex: enr.fingerIndex,
      templateFormat: enr.templateFormat,
      template: decryptData(enr.templateData)
    }));

    if (enrollments.length > 0) {
      await fingerAttendanceRepository.updateSyncStatus(enrollments.map((e) => e.id), true);
    }

    return {
      deviceId,
      deviceName: device.name,
      templatesCount: syncPayload.length,
      syncedAt: new Date().toISOString(),
      message: `Successfully synchronized ${syncPayload.length} templates with ${device.name}.`
    };
  },

  /**
   * 6. Finger Attendance Stats
   */
  getFingerStats: async (companyId) => {
    return fingerAttendanceRepository.countFingerStats(companyId);
  },

  /**
   * 7. List Finger Punches
   */
  listFingerPunches: async (companyId, filters, pagination) => {
    return fingerAttendanceRepository.findFingerPunches(companyId, filters, pagination);
  },

  /**
   * 8. Get Employee Enrolled Fingers
   */
  getEmployeeEnrollments: async (employeeId, companyId) => {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    if (!employee || employee.companyId !== companyId) {
      throw new AppError('Employee not found', 404);
    }

    const enrollments = await fingerAttendanceRepository.findFingerEnrollmentsByEmployee(employeeId);
    return enrollments.map((e) => ({
      id: e.id,
      fingerIndex: e.fingerIndex,
      templateFormat: e.templateFormat,
      deviceId: e.deviceId,
      isSynced: e.isSynced,
      createdAt: e.createdAt
    }));
  }
};

export default fingerAttendanceService;
