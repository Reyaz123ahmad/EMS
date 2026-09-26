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
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [userRole];
    if (userRole === 'SUPER_ADMIN' || userRoles.includes('SUPER_ADMIN') || roles.some(r => userRoles.includes(r))) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: `Access denied. Requires one of: ${roles.join(', ')}`
    });
  };
}


export const authorize = requireRole;

export default requireRole;

