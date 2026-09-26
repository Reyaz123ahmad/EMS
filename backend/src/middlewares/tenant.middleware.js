export const requireCompany = (req, res, next) => {
  if (!req.user?.companyId) {
    return res.status(403).json({
      success: false,
      status: 'error',
      message: 'This feature is only available for company users. Platform Super Admin cannot access this.',
      code: 'PLATFORM_ADMIN_NOT_ALLOWED'
    });
  }
  next();
};

export default {
  requireCompany
};
