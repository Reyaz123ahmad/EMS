import { verifyAccessToken } from '../security/jwt.js';

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token missing or invalid'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication token has expired or is invalid'
    });
  }
}

export default authenticate;
