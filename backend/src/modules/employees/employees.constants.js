export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
  INTERN: 'INTERN',
  CONSULTANT: 'CONSULTANT'
};

export const EMPLOYEE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  TERMINATED: 'TERMINATED',
  RESIGNED: 'RESIGNED',
  ON_LEAVE: 'ON_LEAVE'
};

export const DEFAULT_LEAVE_QUOTAS = [
  { name: 'Casual Leave', code: 'CL', days: 12, isPaid: true },
  { name: 'Sick Leave', code: 'SL', days: 10, isPaid: true },
  { name: 'Earned Leave', code: 'EL', days: 15, isPaid: true }
];

export default {
  EMPLOYMENT_TYPES,
  EMPLOYEE_STATUS,
  DEFAULT_LEAVE_QUOTAS
};
