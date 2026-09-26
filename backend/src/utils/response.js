export class AppError extends Error {
  constructor(message, statusCode = 400, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res, message = 'Error', statusCode = 400, code = null) => {
  const body = { success: false, message };
  if (code) body.code = code;
  return res.status(statusCode).json(body);
};

export const validationErrorResponse = (res, errors = []) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: Array.isArray(errors)
      ? errors.map(e => ({ field: e.field || e.path?.join('.') || 'unknown', message: e.message }))
      : errors
  });
};

export const notFoundResponse = (res, message = 'Resource not found') => {
  return res.status(404).json({ success: false, message });
};

export const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return res.status(401).json({ success: false, message });
};

export const forbiddenResponse = (res, message = 'Access denied', code = null) => {
  const body = { success: false, message };
  if (code) body.code = code;
  return res.status(403).json(body);
};

// Backward-compatibility aliases
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    status: 'ok',
    message,
    data
  });
};

export const sendError = (res, message = 'Error', statusCode = 400, extra = {}) => {
  return res.status(statusCode).json({
    success: false,
    status: 'error',
    message,
    ...extra
  });
};

export default {
  AppError,
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  sendSuccess,
  sendError
};
