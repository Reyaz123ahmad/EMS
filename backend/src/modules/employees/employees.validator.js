import Joi from 'joi';

export const sendEmployeeOTPSchema = Joi.object({
  employeeData: Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional().allow('', null),
    departmentId: Joi.string().optional().allow('', null),
    designationId: Joi.string().optional().allow('', null),
    branchId: Joi.string().optional().allow('', null),
    shiftId: Joi.string().optional().allow('', null),
    joiningDate: Joi.date().iso().optional(),
    employmentType: Joi.string()
      .valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT')
      .default('FULL_TIME'),
    employeeCode: Joi.string().optional().allow('', null),
    roleId: Joi.string().optional().allow('', null),
    role: Joi.string().valid('HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE').optional().allow('', null),
    status: Joi.string()
      .valid('ACTIVE', 'INACTIVE', 'TERMINATED', 'RESIGNED', 'ON_LEAVE')
      .optional()
  }).required(),
  companyId: Joi.string().optional()
});

export const verifyEmployeeOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  emailOtp: Joi.string().length(6).optional(),
  phoneOtp: Joi.string().length(6).optional(),
  otp: Joi.string().length(6).optional(),
  sessionId: Joi.string().required()
});

export const createEmployeeSchema = Joi.object({
  sessionId: Joi.string().required(),
  employeeData: Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional().allow('', null),
    departmentId: Joi.string().optional().allow('', null),
    designationId: Joi.string().optional().allow('', null),
    branchId: Joi.string().optional().allow('', null),
    shiftId: Joi.string().optional().allow('', null),
    joiningDate: Joi.date().iso().optional(),
    employmentType: Joi.string()
      .valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT')
      .default('FULL_TIME'),
    employeeCode: Joi.string().optional().allow('', null),
    roleId: Joi.string().optional().allow('', null),
    role: Joi.string().valid('HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE').optional().allow('', null),
    status: Joi.string()
      .valid('ACTIVE', 'INACTIVE', 'TERMINATED', 'RESIGNED', 'ON_LEAVE')
      .optional()
  }).required(),
  companyId: Joi.string().optional()
});

export const updateEmployeeSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  phone: Joi.string().optional().allow('', null),
  departmentId: Joi.string().optional().allow('', null),
  designationId: Joi.string().optional().allow('', null),
  branchId: Joi.string().optional().allow('', null),
  shiftId: Joi.string().optional().allow('', null),
  employmentType: Joi.string()
    .valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT')
    .optional(),
  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE', 'TERMINATED', 'RESIGNED', 'ON_LEAVE')
    .optional()
});

export const updateEmployeeRoleSchema = Joi.object({
  roleId: Joi.string().optional().allow('', null),
  role: Joi.string().valid('HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE').optional().allow('', null)
}).or('roleId', 'role');

export const employeeFiltersSchema = Joi.object({
  departmentId: Joi.string().optional().allow('', null),
  designationId: Joi.string().optional().allow('', null),
  branchId: Joi.string().optional().allow('', null),
  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE', 'TERMINATED', 'RESIGNED', 'ON_LEAVE', 'EXPIRED', 'SUSPENDED')
    .optional()
    .allow('', null),
  search: Joi.string().optional().allow('', null),
  employeeCode: Joi.string().optional().allow('', null),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(500).optional().default(10)
});

export const listEmployeesSchema = employeeFiltersSchema;

export default {
  sendEmployeeOTPSchema,
  verifyEmployeeOTPSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  updateEmployeeRoleSchema,
  employeeFiltersSchema,
  listEmployeesSchema
};
