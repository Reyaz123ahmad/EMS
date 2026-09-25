export class AppError extends Error {
  constructor(message, statusCode = 400, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'ok',
    message,
    data
  });
};

export const sendError = (res, message = 'Error', statusCode = 400, extra = {}) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    ...extra
  });
};

export default {
  AppError,
  sendSuccess,
  sendError
};
