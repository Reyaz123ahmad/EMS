import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Generate Access Token for a user
 * @param {Object} user 
 * @returns {string} JWT access token
 */
export function generateAccessToken(user) {
  const payload = {
    sub: user.id || user._id,
    email: user.email,
    role: user.role,
    companyId: user.companyId || null
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
}

/**
 * Generate Refresh Token for a user
 * @param {Object} user 
 * @returns {string} JWT refresh token
 */
export function generateRefreshToken(user) {
  const payload = {
    sub: user.id || user._id,
    tokenVersion: user.tokenVersion || 0
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.JWT_REFRESH_EXPIRES_IN_DAYS}d`,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
}

/**
 * Verify Access Token
 * @param {string} token 
 * @returns {Object} Decoded payload
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
}

/**
 * Verify Refresh Token
 * @param {string} token 
 * @returns {Object} Decoded payload
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
}
