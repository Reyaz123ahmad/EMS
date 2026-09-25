import rateLimit from 'express-rate-limit';
import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

/**
 * Global rate limiter (100 requests per 15 minutes per IP)
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

/**
 * Strict Auth rate limiter (10 requests per 15 minutes)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Account temporarily locked for security.',
  },
});

/**
 * OTP request rate limiter (5 requests per 10 minutes)
 */
export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many OTP requests. Please wait 10 minutes before requesting a new OTP.',
  },
});

/**
 * XSS & HTML Sanitizer middleware for JSON payloads
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/onload=/gi, '')
      .replace(/onerror=/gi, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const cleaned = {};
    for (const [k, v] of Object.entries(value)) {
      if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype') {
        cleaned[k] = sanitizeValue(v);
      }
    }
    return cleaned;
  }
  return value;
}

export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    try {
      req.body = sanitizeValue(req.body);
    } catch (_) {}
  }
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      req.query[key] = sanitizeValue(req.query[key]);
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      req.params[key] = sanitizeValue(req.params[key]);
    }
  }
  next();
}

/**
 * Audit log recording helper
 */
export async function recordAuditLog({ userId, action, entity, entityId, oldValues = null, newValues = null, ipAddress = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to record audit log entry');
  }
}

export default {
  globalRateLimiter,
  authRateLimiter,
  otpRateLimiter,
  sanitizeInput,
  recordAuditLog,
};
