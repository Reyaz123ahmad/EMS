/**
 * Middleware: Require one of the specified roles
 * @param  {...string} allowedRoles 
 */
export function requireRole(...allowedRoles) {
  const roles = allowedRoles.flat(Infinity);
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    if (userRole === 'SUPER_ADMIN' || roles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: `Access denied. Requires one of: ${roles.join(', ')}`
    });
  };
}


export default requireRole;
