import { biometricDevicesRepository } from '../modules/biometric-devices/biometric-devices.repository.js';

export async function authenticateDevice(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'] ||
      (req.headers.authorization && req.headers.authorization.startsWith('Device ')
        ? req.headers.authorization.replace('Device ', '')
        : (req.headers.authorization && req.headers.authorization.startsWith('Bearer ems_dev_')
          ? req.headers.authorization.replace('Bearer ', '')
          : req.headers.authorization));

    if (!apiKey) {
      return res.status(401).json({
        status: 'error',
        message: 'Device API key missing. Please provide x-api-key or Authorization header.'
      });
    }

    const device = await biometricDevicesRepository.findDeviceByApiKey(apiKey);
    if (!device) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or unregistered biometric device API key.'
      });
    }

    if (!device.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Biometric device is deactivated or suspended.'
      });
    }

    req.device = device;
    req.company = device.company;
    req.user = {
      id: device.id,
      companyId: device.companyId,
      role: 'DEVICE'
    };

    next();
  } catch (error) {
    next(error);
  }
}

export default authenticateDevice;
