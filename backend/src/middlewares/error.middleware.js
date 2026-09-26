import { ERROR_MESSAGES } from '../utils/error-messages.js';
import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    code: err.code,
    url: req.url,
    method: req.method,
    userId: req.user?.id || req.user?.userId,
    companyId: req.user?.companyId,
    timestamp: new Date().toISOString()
  }, 'Application error occurred');

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'This record already exists' });
  }
  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  // Prisma foreign key constraint failure
  if (err.code === 'P2003') {
    return res.status(400).json({ success: false, message: 'Related record not found' });
  }
  // Prisma relation violation
  if (err.code === 'P2014') {
    return res.status(400).json({ success: false, message: 'Invalid relationship' });
  }
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ success: false, message: 'Invalid data provided' });
  }
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(500).json({ success: false, message: 'Database operation failed' });
  }
  if (err.name === 'PrismaClientUnknownRequestError') {
    return res.status(500).json({ success: false, message: 'Database error occurred' });
  }

  // JWT errors
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
  if (err.name === 'NotBeforeError') {
    return res.status(401).json({ success: false, message: 'Token not yet valid.' });
  }

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.details ? err.details.map(d => ({ field: d.path.join('.'), message: d.message })) : []
    });
  }

  // Custom errors with status code
  if (err.statusCode || err.status) {
    const statusCode = err.statusCode || err.status;
    const body = { success: false, message: err.message || 'Error occurred' };
    if (err.code) body.code = err.code;
    return res.status(statusCode).json(body);
  }

  // Default internal server error (never leak stack or internal details)
  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.'
  });
};

export default errorHandler;
