// import employeesService from './employees.service.js';
// import {
//   sendEmployeeOTPSchema,
//   verifyEmployeeOTPSchema,
//   createEmployeeSchema,
//   updateEmployeeSchema,
//   updateEmployeeRoleSchema,
//   employeeFiltersSchema
// } from './employees.validator.js';
// import { getAuthEmployeeId, getAuthEmployee, getManagerTeamIds } from '../../security/data-scope.js';
// import { prisma } from '../../config/prisma.js';
// import cloudinary, { uploadBuffer, uploadBase64Image } from '../../config/cloudinary.js';

// export const employeesController = {
//   /**
//    * GET /employees/me/photo
//    */
//   async getMyPhoto(req, res, next) {
//     try {
//       const userId = req.user?.id;
//       let employee = await prisma.employee.findFirst({ where: { userId } });
//       if (!employee && req.user?.companyId) {
//         employee = await prisma.employee.findFirst({ where: { email: req.user.email, companyId: req.user.companyId } });
//       }
//       res.status(200).json({ status: 'ok', success: true, photoUrl: employee?.photoUrl || null, data: { photoUrl: employee?.photoUrl || null } });
//     } catch (err) {
//       next(err);
//     }
//   },

//   /**
//    * POST /employees/me/photo
//    */
//   async uploadMyPhoto(req, res, next) {
//     try {
//       const userId = req.user?.id;
//       let employee = await prisma.employee.findFirst({ where: { userId } });
//       if (!employee && req.user?.companyId) {
//         employee = await prisma.employee.findFirst({ where: { email: req.user.email, companyId: req.user.companyId } });
//       }

//       const file = req.file || (req.files && req.files[0]);
//       let photoUrl = null;
//       let photoPublicId = null;

//       if (file) {
//         try {
//           const uploadResult = await uploadBuffer(file.buffer, {
//             folder: 'ems/profiles',
//             resource_type: 'image'
//           });
//           if (uploadResult?.secure_url) {
//             photoUrl = uploadResult.secure_url;
//             photoPublicId = uploadResult.public_id;
//           }
//         } catch (cloudErr) {
//           const mime = file.mimetype || 'image/jpeg';
//           photoUrl = `data:${mime};base64,${file.buffer.toString('base64')}`;
//         }
//       } else if (req.body?.photo || req.body?.photoUrl || req.body?.image) {
//         const photoData = req.body.photo || req.body.photoUrl || req.body.image;
//         if (typeof photoData === 'string' && photoData.startsWith('data:')) {
//           try {
//             const uploadResult = await uploadBase64Image(photoData, 'ems/profiles');
//             if (uploadResult?.secure_url) {
//               photoUrl = uploadResult.secure_url;
//               photoPublicId = uploadResult.public_id;
//             }
//           } catch (cloudErr) {
//             photoUrl = photoData;
//           }
//         } else {
//           photoUrl = photoData;
//         }
//       }

//       if (!photoUrl) {
//         return res.status(400).json({ status: 'error', message: 'No photo provided' });
//       }

//       if (employee) {
//         employee = await prisma.employee.update({
//           where: { id: employee.id },
//           data: { photoUrl, photoPublicId }
//         });
//       }

//       res.status(200).json({
//         status: 'ok',
//         success: true,
//         message: 'Profile photo updated successfully',
//         photoUrl,
//         data: { photoUrl, employee }
//       });
//     } catch (err) {
//       next(err);
//     }
//   },

//   /**
//    * DELETE /employees/me/photo
//    */
//   async deleteMyPhoto(req, res, next) {
//     try {
//       const userId = req.user?.id;
//       let employee = await prisma.employee.findFirst({ where: { userId } });
//       if (!employee && req.user?.companyId) {
//         employee = await prisma.employee.findFirst({ where: { email: req.user.email, companyId: req.user.companyId } });
//       }
//       if (employee) {
//         if (employee.photoPublicId) {
//           try {
//             await cloudinary.uploader.destroy(employee.photoPublicId);
//           } catch (e) {
//             // ignore
//           }
//         }
//         employee = await prisma.employee.update({
//           where: { id: employee.id },
//           data: { photoUrl: null, photoPublicId: null }
//         });
//       }
//       res.status(200).json({ status: 'ok', success: true, message: 'Profile photo removed' });
//     } catch (err) {
//       next(err);
//     }
//   },

//   /**
//    * PUT /employees/me/profile
//    */
//   async updateMyProfile(req, res, next) {
//     try {
//       const userId = req.user?.id;
//       const role = req.user?.role || 'EMPLOYEE';
//       let employee = await prisma.employee.findFirst({ where: { userId } });
//       if (!employee && req.user?.companyId) {
//         employee = await prisma.employee.findFirst({ where: { email: req.user.email, companyId: req.user.companyId } });
//       }
//       if (!employee) {
//         return res.status(404).json({ status: 'error', message: 'Employee profile not found' });
//       }

//       const updateData = {};
//       if (req.body.phone !== undefined) {
//         updateData.phone = req.body.phone;
//         if (userId) {
//           await prisma.user.update({
//             where: { id: userId },
//             data: { phone: req.body.phone }
//           }).catch(() => {});
//         }
//       }
//       if (req.body.gender !== undefined) updateData.gender = req.body.gender;
//       if (req.body.dateOfBirth) updateData.dateOfBirth = new Date(req.body.dateOfBirth);

//       if (role !== 'EMPLOYEE') {
//         if (req.body.firstName) updateData.firstName = req.body.firstName;
//         if (req.body.lastName) updateData.lastName = req.body.lastName;
//       }

//       const updated = await prisma.employee.update({
//         where: { id: employee.id },
//         data: updateData,
//         include: {
//           department: true,
//           designation: true,
//           branch: true
//         }
//       });

//       res.status(200).json({
//         status: 'ok',
//         success: true,
//         message: 'Profile details saved successfully',
//         data: { employee: updated }
//       });
//     } catch (err) {
//       next(err);
//     }
//   },
//   /**
//    * POST /employees/send-otp
//    */
//   async sendEmployeeOTP(req, res, next) {
//     try {
//       const { error, value } = sendEmployeeOTPSchema.validate(req.body);
//       if (error) {
//         return res.status(400).json({ status: 'error', message: error.details[0].message });
//       }

//       const companyId = req.user?.companyId || req.body.companyId;
//       if (!companyId) {
//         return res.status(400).json({ status: 'error', message: 'Company ID is required.' });
//       }

//       const result = await employeesService.sendEmployeeOTP({
//         employeeData: value.employeeData,
//         companyId,
//         createdBy: req.user?.id,
//         reqUser: req.user
//       });
//       res.status(200).json({ status: 'ok', data: result });
//     } catch (err) {
//       if (err.statusCode) {
//         return res.status(err.statusCode).json({ status: 'error', message: err.message });
//       }
//       next(err);
//     }
//   },

//   /**
//    * POST /employees/verify-otp
//    */
//   async verifyEmployeeOTP(req, res, next) {
//     try {
//       const { error, value } = verifyEmployeeOTPSchema.validate(req.body);
//       if (error) {
//         return res.status(400).json({ status: 'error', message: error.details[0].message });
//       }

//       const result = await employeesService.verifyEmployeeOTP(value);
//       res.status(200).json({ status: 'ok', data: result });
//     } catch (err) {
//       res.status(400).json({ status: 'error', message: err.message });
//     }
//   },

//   /**
//    * POST /employees/create
//    */
//   async createEmployeeWithUser(req, res, next) {
//     try {
//       const { error, value } = createEmployeeSchema.validate(req.body);
//       if (error) {
//         return res.status(400).json({ status: 'error', message: error.details[0].message });
//       }

//       const companyId = req.user?.companyId || req.body.companyId;
//       if (!companyId) {
//         return res.status(400).json({ status: 'error', message: 'Company ID is required.' });
//       }

//       const result = await employeesService.createEmployeeWithUser({
//         sessionId: value.sessionId,
//         employeeData: value.employeeData,
//         companyId,
//         createdBy: req.user?.id,
//         reqUser: req.user
//       });
//       res.status(201).json({ status: 'ok', data: result });
//     } catch (err) {
//       if (err.statusCode) {
//         return res.status(err.statusCode).json({ status: 'error', message: err.message });
//       }
//       next(err);
//     }
//   },

//   /**
//    * GET /employees
//    */
//   async listEmployees(req, res, next) {
//     try {
//       const { error, value } = employeeFiltersSchema.validate(req.query);
//       if (error) {
//         return res.status(400).json({ status: 'error', message: error.details[0].message });
//       }

//       const role = req.user?.role || 'EMPLOYEE';
//       const companyId = req.user?.companyId;
//       const { page, limit, ...filters } = value;

//       if (role === 'EMPLOYEE') {
//         const authEmpId = await getAuthEmployeeId(req);
//         filters.id = authEmpId;
//       } else if (role === 'MANAGER') {
//         const emp = await getAuthEmployee(req);
//         filters.employeeIds = await getManagerTeamIds(emp?.id);
//       } else if (role === 'HR_MANAGER') {
//         const emp = await getAuthEmployee(req);
//         if (emp?.departmentId) filters.departmentId = emp.departmentId;
//       }

//       const result = await employeesService.listEmployees(companyId, filters, { page, limit });
//       res.status(200).json({ status: 'ok', data: result });
//     } catch (err) {
//       next(err);
//     }
//   },

//   /**
//    * GET /employees/:id
//    */
//   async getEmployee(req, res, next) {
//     try {
//       const { id } = req.params;
//       const role = req.user?.role || 'EMPLOYEE';

//       const employee = await employeesService.getEmployeeById(id);
//       if (!employee) {
//         return res.status(404).json({ status: 'error', message: 'Employee not found' });
//       }

//       // Check authorization
//       if (role === 'EMPLOYEE') {
//         const authEmpId = await getAuthEmployeeId(req);
//         if (employee.id !== authEmpId) {
//           return res.status(403).json({ status: 'error', message: 'Access denied: You can only view your own profile' });
//         }
//       } else if (role === 'MANAGER') {
//         const emp = await getAuthEmployee(req);
//         const teamIds = await getManagerTeamIds(emp?.id);
//         if (!teamIds.includes(employee.id)) {
//           return res.status(403).json({ status: 'error', message: 'Access denied: Employee is outside your team' });
//         }
//       } else if (role === 'HR_MANAGER') {
//         const emp = await getAuthEmployee(req);
//         if (employee.departmentId && emp?.departmentId && employee.departmentId !== emp.departmentId) {
//           return res.status(403).json({ status: 'error', message: 'Access denied: Employee belongs to a different department' });
//         }
//       }

//       res.status(200).json({ status: 'ok', data: { employee } });
//     } catch (err) {
//       next(err);
//     }
//   },

//   /**
//    * PUT /employees/:id
//    */
//   async updateEmployee(req, res, next) {
//     try {
//       const { id } = req.params;
//       const { error, value } = updateEmployeeSchema.validate(req.body);
//       if (error) {
//         return res.status(400).json({ status: 'error', message: error.details[0].message });
//       }

//       const employee = await employeesService.updateEmployee(id, value, req.user?.companyId, req.user?.id);
//       res.status(200).json({
//         status: 'ok',
//         message: 'Employee updated successfully.',
//         data: { employee }
//       });
//     } catch (err) {
//       next(err);
//     }
//   },

//   /**
//    * DELETE /employees/:id
//    */
//   async deleteEmployee(req, res, next) {
//     try {
//       const { id } = req.params;
//       const employee = await employeesService.deleteEmployee(id);
//       res.status(200).json({
//         status: 'ok',
//         message: 'Employee deleted successfully.',
//         data: { employee }
//       });
//     } catch (err) {
//       next(err);
//     }
//   },

//   /**
//    * GET /employees/:id/dashboard
//    * 
//    */
//       async getDashboard(req, res, next) {
//     try {
//       const { id } = req.params;
//       const role = req.user?.role || 'EMPLOYEE';

//       if (role === 'EMPLOYEE') {
//         const authEmpId = await getAuthEmployeeId(req);
//         if (id !== authEmpId) {
//           return res.status(403).json({ status: 'error', message: 'Access denied: You can only view your own dashboard' });
//         }
//       }

//       try {
//         const dashboard = await employeesService.getEmployeeDashboard(id);
//         return res.status(200).json({ status: 'ok', data: dashboard });
//       } catch (dashErr) {
//         return res.status(404).json({ status: 'error', message: 'Employee dashboard not found' });
//       }
//     } catch (err) {
//       next(err);
//     }
//   },
// //   async getDashboard(req, res, next) {
// //     try {
// //       const { id } = req.params;
// //       const role = req.user?.role || 'EMPLOYEE';

// //       if (role === 'EMPLOYEE') {
// //         const authEmpId = await getAuthEmployeeId(req);
// //         if (id !== authEmpId) {
// //           return res.status(403).json({ status: 'error', message: 'Access denied: You can only view your own dashboard' });
// //         }
// //       }

// //       try {
// //         const dashboard = await employeesService.getEmployeeDashboard(id);
// //         return res.status(200).json({ status: 'ok', data: dashboard });
// //       } catch (dashErr) {
// //         return res.status(404).json({ status: 'error', message: 'Employee dashboard not found' });
// //       }
// //   },

// //   /**
// //    * POST /employees/:id/face
// //    */
// //   async registerFace(req, res, next) {
// //     try {
// //       const { id } = req.params;
// //       const { photoUrl, embedding } = req.body;
// //       if (!photoUrl) {
// //         return res.status(400).json({ status: 'error', message: 'photoUrl is required.' });
// //       }

// //       const employee = await employeesService.registerFace(id, photoUrl, embedding || []);
// //       res.status(200).json({
// //         status: 'ok',
// //         message: 'Face registered successfully.',
// //         data: { employee }
// //       });
// //     } catch (err) {
// //       next(err);
// //     }
// //   },

// //   /**
// //    * POST /employees/bulk-import
// //    */
// //   async bulkImport(req, res, next) {
// //     try {
// //       const companyId = req.user?.companyId || req.body.companyId;
// //       const rows = req.body.rows || [];
// //       const result = await employeesService.bulkImportEmployees({
// //         rows,
// //         companyId,
// //         createdBy: req.user?.id
// //       });
// //       res.status(200).json({ status: 'ok', data: result });
// //     } catch (err) {
// //       next(err);
// //     }
// //   },

// //   /**
// //    * GET /employees/export
// //    */
// //   async exportEmployees(req, res, next) {
// //     try {
// //       const companyId = req.user?.companyId;
// //       const result = await employeesService.exportEmployees(companyId, req.query);
// //       res.status(200).json({ status: 'ok', data: result });
// //     } catch (err) {
// //       next(err);
// //     }
// //   },

// //   /**
// //    * GET /employees/stats
// //    */
// //   async getStats(req, res, next) {
// //     try {
// //       const companyId = req.user?.companyId;
// //       const result = await employeesService.getEmployeeStats(companyId);
// //       res.status(200).json({ status: 'ok', data: result });
// //     } catch (err) {
// //       next(err);
// //     }
// //   },

// //   /**
// //    * GET /employees/analytics
// //    */
// //   async getAnalytics(req, res, next) {
// //     try {
// //       const companyId = req.user?.companyId;
// //       const { startDate, endDate } = req.query;
// //       const result = await employeesService.getEmployeeAnalytics(companyId, { startDate, endDate });
// //       res.status(200).json({ status: 'ok', success: true, data: result });
// //     } catch (err) {
// //       next(err);
// //     }
// //   },

// //   /**
// //    * GET /employees/managers
// //    */
// //   async getManagers(req, res, next) {
// //     try {
// //       const companyId = req.user?.companyId;
// //       if (!companyId) {
// //         const err = new Error('companyId missing on user context');
// //         err.statusCode = 401;
// //         throw err;
// //       }

// //       const managers = await prisma.user.findMany({
// //         where: {
// //           companyId,
// //           status: 'ACTIVE',
// //           userRoles: {
// //             some: { role: { name: 'MANAGER' } }
// //           }
// //         },
// //         select: {
// //           id: true,
// //           email: true,
// //           employee: {
// //             select: {
// //               id: true,
// //               firstName: true,
// //               lastName: true,
// //               employeeCode: true,
// //               department: { select: { name: true } }
// //             }
// //           }
// //         },
// //         orderBy: { createdAt: 'desc' }
// //       });

// //       return res.status(200).json({
// //         status: 'ok',
// //         success: true,
// //         data: managers,
// //         managers,
// //         message: 'Managers retrieved'
// //       });
// //     } catch (error) {
// //       next(error);
// //     }
// //   },

// //   /**
// //    * PATCH /employees/:id/role
// //    */
// //   async updateEmployeeRole(req, res, next) {
// //     try {
// //       const { error, value } = updateEmployeeRoleSchema.validate(req.body);
// //       if (error) {
// //         return res.status(400).json({ status: 'error', message: error.details[0].message });
// //       }

// //       const result = await employeesService.updateEmployeeRole(
// //         req.params.id,
// //         value,
// //         req.user
// //       );

// //       return res.status(200).json({
// //         status: 'ok',
// //         success: true,
// //         data: result,
// //         message: 'Employee role updated successfully'
// //       });
// //     } catch (err) {
// //       if (err.statusCode) {
// //         return res.status(err.statusCode).json({ status: 'error', message: err.message });
// //       }
// //       next(err);
// //     }
// //   }
// // };

// export const getMyPhoto = employeesController.getMyPhoto;
// export const uploadMyPhoto = employeesController.uploadMyPhoto;
// export const deleteMyPhoto = employeesController.deleteMyPhoto;
// export const updateMyProfile = employeesController.updateMyProfile;
// export const sendEmployeeOTP = employeesController.sendEmployeeOTP;
// export const verifyEmployeeOTP = employeesController.verifyEmployeeOTP;
// export const createEmployeeWithUser = employeesController.createEmployeeWithUser;
// export const bulkImport = employeesController.bulkImport;
// export const exportEmployees = employeesController.exportEmployees;
// export const getStats = employeesController.getStats;
// export const getAnalytics = employeesController.getAnalytics;
// export const getManagers = employeesController.getManagers;
// export const listEmployees = employeesController.listEmployees;
// export const getEmployee = employeesController.getEmployee;
// export const updateEmployee = employeesController.updateEmployee;
// export const updateEmployeeRole = employeesController.updateEmployeeRole;
// export const deleteEmployee = employeesController.deleteEmployee;
// export const getDashboard = employeesController.getDashboard;
// export const registerFace = employeesController.registerFace;

// export default employeesController;





import employeesService from './employees.service.js';
import {
  sendEmployeeOTPSchema,
  verifyEmployeeOTPSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  updateEmployeeRoleSchema,
  employeeFiltersSchema
} from './employees.validator.js';
import { getAuthEmployeeId, getAuthEmployee, getManagerTeamIds } from '../../security/data-scope.js';
import { prisma } from '../../config/prisma.js';
import cloudinary, { uploadBuffer, uploadBase64Image } from '../../config/cloudinary.js';

export const employeesController = {
  /**
   * GET /employees/me/photo
   */
  async getMyPhoto(req, res, next) {
    try {
      const userId = req.user?.id;
      let employee = await prisma.employee.findFirst({ where: { userId } });
      if (!employee && req.user?.companyId) {
        employee = await prisma.employee.findFirst({ where: { email: req.user.email, companyId: req.user.companyId } });
      }
      res.status(200).json({ status: 'ok', success: true, photoUrl: employee?.photoUrl || null, data: { photoUrl: employee?.photoUrl || null } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /employees/me/photo
   */
  async uploadMyPhoto(req, res, next) {
    try {
      const userId = req.user?.id;
      let employee = await prisma.employee.findFirst({ where: { userId } });
      if (!employee && req.user?.companyId) {
        employee = await prisma.employee.findFirst({ where: { email: req.user.email, companyId: req.user.companyId } });
      }

      const file = req.file || (req.files && req.files[0]);
      let photoUrl = null;
      let photoPublicId = null;

      if (file) {
        try {
          const uploadResult = await uploadBuffer(file.buffer, {
            folder: 'ems/profiles',
            resource_type: 'image'
          });
          if (uploadResult?.secure_url) {
            photoUrl = uploadResult.secure_url;
            photoPublicId = uploadResult.public_id;
          }
        } catch (cloudErr) {
          const mime = file.mimetype || 'image/jpeg';
          photoUrl = `data:${mime};base64,${file.buffer.toString('base64')}`;
        }
      } else if (req.body?.photo || req.body?.photoUrl || req.body?.image) {
        const photoData = req.body.photo || req.body.photoUrl || req.body.image;
        if (typeof photoData === 'string' && photoData.startsWith('data:')) {
          try {
            const uploadResult = await uploadBase64Image(photoData, 'ems/profiles');
            if (uploadResult?.secure_url) {
              photoUrl = uploadResult.secure_url;
              photoPublicId = uploadResult.public_id;
            }
          } catch (cloudErr) {
            photoUrl = photoData;
          }
        } else {
          photoUrl = photoData;
        }
      }

      if (!photoUrl) {
        return res.status(400).json({ status: 'error', message: 'No photo provided' });
      }

      if (employee) {
        employee = await prisma.employee.update({
          where: { id: employee.id },
          data: { photoUrl, photoPublicId }
        });
      }

      res.status(200).json({
        status: 'ok',
        success: true,
        message: 'Profile photo updated successfully',
        photoUrl,
        data: { photoUrl, employee }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /employees/me/photo
   */
  async deleteMyPhoto(req, res, next) {
    try {
      const userId = req.user?.id;
      let employee = await prisma.employee.findFirst({ where: { userId } });
      if (!employee && req.user?.companyId) {
        employee = await prisma.employee.findFirst({ where: { email: req.user.email, companyId: req.user.companyId } });
      }
      if (employee) {
        if (employee.photoPublicId) {
          try {
            await cloudinary.uploader.destroy(employee.photoPublicId);
          } catch (e) {
            // ignore
          }
        }
        employee = await prisma.employee.update({
          where: { id: employee.id },
          data: { photoUrl: null, photoPublicId: null }
        });
      }
      res.status(200).json({ status: 'ok', success: true, message: 'Profile photo removed' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /employees/me/profile
   */
  async updateMyProfile(req, res, next) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role || 'EMPLOYEE';
      let employee = await prisma.employee.findFirst({ where: { userId } });
      if (!employee && req.user?.companyId) {
        employee = await prisma.employee.findFirst({ where: { email: req.user.email, companyId: req.user.companyId } });
      }
      if (!employee) {
        return res.status(404).json({ status: 'error', message: 'Employee profile not found' });
      }

      const updateData = {};
      if (req.body.phone !== undefined) {
        updateData.phone = req.body.phone;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { phone: req.body.phone }
          }).catch(() => {});
        }
      }
      if (req.body.gender !== undefined) updateData.gender = req.body.gender;
      if (req.body.dateOfBirth) updateData.dateOfBirth = new Date(req.body.dateOfBirth);

      if (role !== 'EMPLOYEE') {
        if (req.body.firstName) updateData.firstName = req.body.firstName;
        if (req.body.lastName) updateData.lastName = req.body.lastName;
      }

      const updated = await prisma.employee.update({
        where: { id: employee.id },
        data: updateData,
        include: {
          department: true,
          designation: true,
          branch: true
        }
      });

      res.status(200).json({
        status: 'ok',
        success: true,
        message: 'Profile details saved successfully',
        data: { employee: updated }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /employees/send-otp
   */
  async sendEmployeeOTP(req, res, next) {
    try {
      const { error, value } = sendEmployeeOTPSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const companyId = req.user?.companyId || req.body.companyId;
      if (!companyId) {
        return res.status(400).json({ status: 'error', message: 'Company ID is required.' });
      }

      const result = await employeesService.sendEmployeeOTP({
        employeeData: value.employeeData,
        companyId,
        createdBy: req.user?.id,
        reqUser: req.user
      });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  },

  /**
   * POST /employees/verify-otp
   */
  async verifyEmployeeOTP(req, res, next) {
    try {
      const { error, value } = verifyEmployeeOTPSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const result = await employeesService.verifyEmployeeOTP(value);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  },

  /**
   * POST /employees/create
   */
  async createEmployeeWithUser(req, res, next) {
    try {
      const { error, value } = createEmployeeSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const companyId = req.user?.companyId || req.body.companyId;
      if (!companyId) {
        return res.status(400).json({ status: 'error', message: 'Company ID is required.' });
      }

      const result = await employeesService.createEmployeeWithUser({
        sessionId: value.sessionId,
        employeeData: value.employeeData,
        companyId,
        createdBy: req.user?.id,
        reqUser: req.user
      });
      res.status(201).json({ status: 'ok', data: result });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  },

  /**
   * GET /employees
   */
  async listEmployees(req, res, next) {
    try {
      const { error, value } = employeeFiltersSchema.validate(req.query);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user?.companyId;
      const { page, limit, ...filters } = value;

      if (role === 'EMPLOYEE') {
        const authEmpId = await getAuthEmployeeId(req);
        filters.id = authEmpId;
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        filters.employeeIds = await getManagerTeamIds(emp?.id);
      } else if (role === 'HR_MANAGER') {
        const emp = await getAuthEmployee(req);
        if (emp?.departmentId) filters.departmentId = emp.departmentId;
      }

      const result = await employeesService.listEmployees(companyId, filters, { page, limit });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees/:id
   */
  async getEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const role = req.user?.role || 'EMPLOYEE';

      const employee = await employeesService.getEmployeeById(id);
      if (!employee) {
        return res.status(404).json({ status: 'error', message: 'Employee not found' });
      }

      if (role === 'EMPLOYEE') {
        const authEmpId = await getAuthEmployeeId(req);
        if (employee.id !== authEmpId) {
          return res.status(403).json({ status: 'error', message: 'Access denied: You can only view your own profile' });
        }
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        const teamIds = await getManagerTeamIds(emp?.id);
        if (!teamIds.includes(employee.id)) {
          return res.status(403).json({ status: 'error', message: 'Access denied: Employee is outside your team' });
        }
      } else if (role === 'HR_MANAGER') {
        const emp = await getAuthEmployee(req);
        if (employee.departmentId && emp?.departmentId && employee.departmentId !== emp.departmentId) {
          return res.status(403).json({ status: 'error', message: 'Access denied: Employee belongs to a different department' });
        }
      }

      res.status(200).json({ status: 'ok', data: { employee } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /employees/:id
   */
  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = updateEmployeeSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const employee = await employeesService.updateEmployee(id, value, req.user?.companyId, req.user?.id);
      res.status(200).json({
        status: 'ok',
        message: 'Employee updated successfully.',
        data: { employee }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /employees/:id
   */
  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await employeesService.deleteEmployee(id);
      res.status(200).json({
        status: 'ok',
        message: 'Employee deleted successfully.',
        data: { employee }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees/:id/dashboard
   */
  async getDashboard(req, res, next) {
    try {
      const { id } = req.params;
      const role = req.user?.role || 'EMPLOYEE';

      if (role === 'EMPLOYEE') {
        const authEmpId = await getAuthEmployeeId(req);
        if (id !== authEmpId) {
          return res.status(403).json({ status: 'error', message: 'Access denied: You can only view your own dashboard' });
        }
      }

      try {
        const dashboard = await employeesService.getEmployeeDashboard(id);
        return res.status(200).json({ status: 'ok', data: dashboard });
      } catch (dashErr) {
        return res.status(404).json({ status: 'error', message: 'Employee dashboard not found' });
      }
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /employees/:id/face
   */
  async registerFace(req, res, next) {
    try {
      const { id } = req.params;
      const { photoUrl, embedding } = req.body;
      if (!photoUrl) {
        return res.status(400).json({ status: 'error', message: 'photoUrl is required.' });
      }

      const employee = await employeesService.registerFace(id, photoUrl, embedding || []);
      res.status(200).json({
        status: 'ok',
        message: 'Face registered successfully.',
        data: { employee }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /employees/bulk-import
   */
  async bulkImport(req, res, next) {
    try {
      const companyId = req.user?.companyId || req.body.companyId;
      const rows = req.body.rows || [];
      const result = await employeesService.bulkImportEmployees({
        rows,
        companyId,
        createdBy: req.user?.id
      });
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees/export
   */
  async exportEmployees(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const result = await employeesService.exportEmployees(companyId, req.query);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees/stats
   */
  async getStats(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const result = await employeesService.getEmployeeStats(companyId);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees/analytics
   */
  async getAnalytics(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      const { startDate, endDate } = req.query;
      const result = await employeesService.getEmployeeAnalytics(companyId, { startDate, endDate });
      res.status(200).json({ status: 'ok', success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /employees/managers
   */
  async getManagers(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        const err = new Error('companyId missing on user context');
        err.statusCode = 401;
        throw err;
      }

      const managers = await prisma.user.findMany({
        where: {
          companyId,
          status: 'ACTIVE',
          userRoles: {
            some: { role: { name: 'MANAGER' } }
          }
        },
        select: {
          id: true,
          email: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({
        status: 'ok',
        success: true,
        data: managers,
        managers,
        message: 'Managers retrieved'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /employees/:id/role
   */
  async updateEmployeeRole(req, res, next) {
    try {
      const { error, value } = updateEmployeeRoleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
      }

      const result = await employeesService.updateEmployeeRole(
        req.params.id,
        value,
        req.user
      );

      return res.status(200).json({
        status: 'ok',
        success: true,
        data: result,
        message: 'Employee role updated successfully'
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ status: 'error', message: err.message });
      }
      next(err);
    }
  }
};

// Named exports
export const getMyPhoto = employeesController.getMyPhoto;
export const uploadMyPhoto = employeesController.uploadMyPhoto;
export const deleteMyPhoto = employeesController.deleteMyPhoto;
export const updateMyProfile = employeesController.updateMyProfile;
export const sendEmployeeOTP = employeesController.sendEmployeeOTP;
export const verifyEmployeeOTP = employeesController.verifyEmployeeOTP;
export const createEmployeeWithUser = employeesController.createEmployeeWithUser;
export const bulkImport = employeesController.bulkImport;
export const exportEmployees = employeesController.exportEmployees;
export const getStats = employeesController.getStats;
export const getAnalytics = employeesController.getAnalytics;
export const getManagers = employeesController.getManagers;
export const listEmployees = employeesController.listEmployees;
export const getEmployee = employeesController.getEmployee;
export const updateEmployee = employeesController.updateEmployee;
export const updateEmployeeRole = employeesController.updateEmployeeRole;
export const deleteEmployee = employeesController.deleteEmployee;
export const getDashboard = employeesController.getDashboard;
export const registerFace = employeesController.registerFace;

export default employeesController;