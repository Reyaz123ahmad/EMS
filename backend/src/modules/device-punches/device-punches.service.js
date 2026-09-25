import prisma from '../../config/prisma.js';
import { devicePunchesRepository } from './device-punches.repository.js';
import { biometricDevicesRepository } from '../biometric-devices/biometric-devices.repository.js';
import { biometricCardsRepository } from '../biometric-cards/biometric-cards.repository.js';
import attendanceService from '../attendance/attendance.service.js';
import attendanceRepository from '../attendance/attendance.repository.js';
import { PUNCH_TYPES, VERIFICATION_TYPES } from './device-punches.constants.js';
import { AppError } from '../../utils/response.js';

export const devicePunchesService = {
  receivePunch: async ({
    deviceId,
    companyId,
    punchType = PUNCH_TYPES.AUTO,
    verification = VERIFICATION_TYPES.FINGERPRINT,
    cardNumber,
    employeeId,
    rawPayload,
    punchedAt = new Date()
  }) => {
    // 1. Verify device belongs to company
    const device = await biometricDevicesRepository.findDeviceById(deviceId);
    if (!device || device.companyId !== companyId) {
      throw new AppError('Biometric device not registered or unauthorized', 403);
    }

    if (!device.isActive) {
      throw new AppError('Biometric device is inactive or decommissioned', 403);
    }

    // Update heartbeat
    await biometricDevicesRepository.updateHeartbeat(deviceId);

    // 2. Identify target employee
    let targetEmployeeId = employeeId;

    if (!targetEmployeeId && cardNumber) {
      const card = await biometricCardsRepository.findCardByNumber(companyId, cardNumber);
      if (card && card.isActive) {
        targetEmployeeId = card.employeeId;
      }
    }

    // 3. Create punch record
    const punch = await devicePunchesRepository.createDevicePunch({
      companyId,
      deviceId,
      employeeId: targetEmployeeId || null,
      cardNumber: cardNumber || null,
      punchType,
      verification,
      rawPayload: rawPayload || null,
      punchedAt: new Date(punchedAt),
      processed: false
    });

    // 4. Process punch immediately
    try {
      if (targetEmployeeId) {
        await devicePunchesService.processPunch(punch.id);
      } else {
        await devicePunchesRepository.updatePunch(punch.id, {
          errorReason: 'Employee could not be identified by provided credentials'
        });
      }
    } catch (processErr) {
      await devicePunchesRepository.updatePunch(punch.id, {
        errorReason: processErr.message
      });
    }

    const updatedPunch = await devicePunchesRepository.findPunchById(punch.id);
    return {
      received: true,
      punchId: punch.id,
      processed: updatedPunch?.processed || false,
      punch: updatedPunch
    };
  },

  processPunch: async (punchId) => {
    const punch = await devicePunchesRepository.findPunchById(punchId);
    if (!punch) {
      throw new AppError('Device punch record not found', 404);
    }

    if (punch.processed) {
      return punch;
    }

    const employeeId = punch.employeeId;
    if (!employeeId) {
      const err = new Error('Cannot process punch without linked employee');
      await devicePunchesRepository.updatePunch(punchId, { errorReason: err.message });
      throw err;
    }

    const companyId = punch.companyId;
    const device = punch.device;
    const branch = punch.employee?.branch || (device.branchId ? await prisma.branch.findUnique({ where: { id: device.branchId } }) : null);

    const punchLocation = branch && branch.latitude !== null && branch.longitude !== null
      ? { lat: Number(branch.latitude), lng: Number(branch.longitude), accuracy: 10 }
      : { lat: 0, lng: 0, accuracy: 10 };

    const mode = punch.verification === VERIFICATION_TYPES.CARD ? 'card' : 'finger';

    let determinedType = punch.punchType;
    if (determinedType === PUNCH_TYPES.AUTO || !determinedType) {
      const todayLog = await attendanceRepository.findTodayAttendance(employeeId);
      if (!todayLog || !todayLog.checkInAt) {
        determinedType = PUNCH_TYPES.CHECK_IN;
      } else {
        const activeBreak = await attendanceRepository.findActiveBreak(todayLog.id);
        if (activeBreak) {
          determinedType = PUNCH_TYPES.BREAK_END;
        } else {
          determinedType = PUNCH_TYPES.CHECK_OUT;
        }
      }
    }

    const op = String(determinedType).toUpperCase().replace('-', '_');

    try {
      switch (op) {
        case 'CHECK_IN':
          await attendanceService.checkIn({
            employeeId,
            companyId,
            mode,
            location: punchLocation,
            deviceInfo: { deviceId: punch.deviceId, isMockLocation: false },
            cardNumber: punch.cardNumber,
            remarks: `Punched via Biometric Device: ${device.name}`
          });
          break;

        case 'CHECK_OUT':
          await attendanceService.checkOut({
            employeeId,
            companyId,
            mode,
            location: punchLocation,
            deviceInfo: { deviceId: punch.deviceId, isMockLocation: false },
            cardNumber: punch.cardNumber,
            remarks: `Punched via Biometric Device: ${device.name}`
          });
          break;

        case 'BREAK_START':
          await attendanceService.breakStart({
            employeeId,
            companyId,
            mode,
            breakType: 'SHORT',
            location: punchLocation,
            deviceInfo: { deviceId: punch.deviceId, isMockLocation: false },
            remarks: `Break started via Device: ${device.name}`
          });
          break;

        case 'BREAK_END':
          await attendanceService.breakEnd({
            employeeId,
            companyId,
            mode,
            location: punchLocation,
            deviceInfo: { deviceId: punch.deviceId, isMockLocation: false },
            remarks: `Break ended via Device: ${device.name}`
          });
          break;

        default:
          throw new Error(`Unsupported punch operation: ${determinedType}`);
      }

      const updated = await devicePunchesRepository.updatePunch(punchId, {
        processed: true,
        errorReason: null
      });

      return updated;
    } catch (err) {
      await devicePunchesRepository.updatePunch(punchId, {
        errorReason: err.message
      });
      throw err;
    }
  },

  listPunches: async (companyId, filters, pagination) => {
    return devicePunchesRepository.findPunchesByCompany(companyId, filters, pagination);
  },

  reprocessPunch: async (punchId, companyId) => {
    const punch = await devicePunchesRepository.findPunchById(punchId);
    if (!punch || punch.companyId !== companyId) {
      throw new AppError('Device punch record not found', 404);
    }

    // Reset error reason and re-process
    await devicePunchesRepository.updatePunch(punchId, { processed: false, errorReason: null });
    return devicePunchesService.processPunch(punchId);
  },

  getPunchStats: async (companyId, dateRange) => {
    return devicePunchesRepository.countPunchesStats(companyId, dateRange);
  }
};
