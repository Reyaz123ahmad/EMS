import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import { biometricDevicesRepository } from './biometric-devices.repository.js';
import { AppError } from '../../utils/response.js';

export const biometricDevicesService = {
  createDevice: async ({ companyId, name, serialNumber, deviceType, branchId, ipAddress, port }) => {
    // 1. Check if device with this serial already exists in company
    const existing = await biometricDevicesRepository.findDeviceBySerial(companyId, serialNumber);
    if (existing) {
      throw new AppError(`A device with serial number '${serialNumber}' already exists in your company.`, 400);
    }

    // 2. Validate branch if provided
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, companyId }
      });
      if (!branch) {
        throw new AppError('Specified branch not found in this company', 404);
      }
    }

    // 3. Generate 64-character hex API key
    const apiKey = `ems_dev_${crypto.randomBytes(28).toString('hex')}`;

    const device = await biometricDevicesRepository.createDevice({
      companyId,
      name,
      serialNumber,
      deviceType,
      branchId: branchId || null,
      ipAddress: ipAddress || null,
      port: port || null,
      apiKey,
      isActive: true,
      isOnline: false
    });

    return device;
  },

  regenerateApiKey: async (deviceId, companyId) => {
    const device = await biometricDevicesRepository.findDeviceById(deviceId);
    if (!device || device.companyId !== companyId) {
      throw new AppError('Biometric device not found', 404);
    }

    const newApiKey = `ems_dev_${crypto.randomBytes(28).toString('hex')}`;
    const updatedDevice = await biometricDevicesRepository.regenerateApiKey(deviceId, newApiKey);

    return {
      id: updatedDevice.id,
      name: updatedDevice.name,
      serialNumber: updatedDevice.serialNumber,
      apiKey: newApiKey
    };
  },

  listDevices: async (companyId, filters, pagination) => {
    return biometricDevicesRepository.findDevicesByCompany(companyId, filters, pagination);
  },

  getDeviceById: async (id, companyId) => {
    const device = await biometricDevicesRepository.findDeviceById(id);
    if (!device || device.companyId !== companyId) {
      throw new AppError('Biometric device not found', 404);
    }
    return device;
  },

  updateDevice: async (id, data, companyId) => {
    const device = await biometricDevicesRepository.findDeviceById(id);
    if (!device || device.companyId !== companyId) {
      throw new AppError('Biometric device not found', 404);
    }

    if (data.branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: data.branchId, companyId }
      });
      if (!branch) {
        throw new AppError('Specified branch not found in this company', 404);
      }
    }

    return biometricDevicesRepository.updateDevice(id, data);
  },

  deactivateDevice: async (id, companyId) => {
    const device = await biometricDevicesRepository.findDeviceById(id);
    if (!device || device.companyId !== companyId) {
      throw new AppError('Biometric device not found', 404);
    }

    return biometricDevicesRepository.deactivateDevice(id);
  },

  updateHeartbeat: async (deviceId) => {
    return biometricDevicesRepository.updateHeartbeat(deviceId);
  },

  getDeviceStatus: async (deviceId, companyId) => {
    const device = await biometricDevicesRepository.findDeviceById(deviceId);
    if (!device || device.companyId !== companyId) {
      throw new AppError('Biometric device not found', 404);
    }

    // Determine online status based on heartbeat within last 5 minutes
    const lastHeartbeat = device.lastHeartbeat ? new Date(device.lastHeartbeat) : null;
    const isRecentlyActive = lastHeartbeat && (Date.now() - lastHeartbeat.getTime() < 5 * 60 * 1000);

    return {
      id: device.id,
      name: device.name,
      serialNumber: device.serialNumber,
      deviceType: device.deviceType,
      isActive: device.isActive,
      isOnline: isRecentlyActive || device.isOnline,
      lastHeartbeat: device.lastHeartbeat,
      ipAddress: device.ipAddress,
      port: device.port,
      branch: device.branch
    };
  }
};
