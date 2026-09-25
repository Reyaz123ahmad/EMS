export function createEmployeePayload(overrides = {}) {
  const ts = Date.now().toString().slice(-4);
  return {
    firstName: 'Aarav',
    lastName: 'Sharma',
    email: `aarav.${ts}@mindtech.com`,
    phone: '+919876543210',
    employmentType: 'FULL_TIME',
    dateOfJoining: '2026-01-15',
    ...overrides,
  };
}

export function createLeavePayload(leaveTypeId, overrides = {}) {
  return {
    leaveTypeId,
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    reason: 'Family function in hometown',
    ...overrides,
  };
}

export function createCouponPayload(overrides = {}) {
  return {
    code: `DISC${Date.now().toString().slice(-4)}`,
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxUses: 100,
    validTo: new Date(Date.now() + 30 * 86400000).toISOString(),
    ...overrides,
  };
}

export function createProjectPayload(clientId, overrides = {}) {
  return {
    clientId,
    name: 'Enterprise Cloud Modernization',
    description: 'Cloud native SaaS architecture implementation',
    status: 'ACTIVE',
    budget: 500000,
    ...overrides,
  };
}

export default {
  createEmployeePayload,
  createLeavePayload,
  createCouponPayload,
  createProjectPayload,
};
