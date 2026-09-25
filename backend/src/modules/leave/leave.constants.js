export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

export const DEFAULT_LEAVE_TYPES = [
  { name: 'Casual Leave', code: 'CL', maxDays: 12, isPaid: true, carryForward: false },
  { name: 'Sick Leave', code: 'SL', maxDays: 10, isPaid: true, carryForward: false },
  { name: 'Earned Leave', code: 'EL', maxDays: 15, isPaid: true, carryForward: true, maxCarryForward: 10 },
  { name: 'Maternity Leave', code: 'ML', maxDays: 90, isPaid: true, carryForward: false },
  { name: 'Paternity Leave', code: 'PL', maxDays: 7, isPaid: true, carryForward: false }
];
