import { generateAccessToken, generateRefreshToken } from '../../src/security/jwt.js';

export function getMockUserTokens({
  userId = 'c32d6fcb-8e95-40ad-bc0b-036cd83a52a6',
  companyId = '1432e74d-35ab-4f27-956a-4fcf11c821c9',
  email = 'admin@company.com',
  role = 'COMPANY_ADMIN',
} = {}) {
  const payload = {
    id: userId,
    email,
    role,
    companyId,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    authHeader: `Bearer ${accessToken}`,
  };
}

export function getSuperAdminToken(companyId = null) {
  return getMockUserTokens({
    email: 'superadmin@edudibon.com',
    role: 'SUPER_ADMIN',
    companyId,
  });
}

export function getCompanyAdminToken(companyId = '1432e74d-35ab-4f27-956a-4fcf11c821c9') {
  return getMockUserTokens({
    email: 'admin@company.com',
    role: 'COMPANY_ADMIN',
    companyId,
  });
}

export function getEmployeeToken(companyId = '1432e74d-35ab-4f27-956a-4fcf11c821c9') {
  return getMockUserTokens({
    email: 'emp@company.com',
    role: 'EMPLOYEE',
    companyId,
  });
}

export function getClientToken(companyId = '1432e74d-35ab-4f27-956a-4fcf11c821c9') {
  return getMockUserTokens({
    email: 'client@partner.com',
    role: 'CLIENT',
    companyId,
  });
}

export default {
  getMockUserTokens,
  getSuperAdminToken,
  getCompanyAdminToken,
  getEmployeeToken,
  getClientToken,
};
