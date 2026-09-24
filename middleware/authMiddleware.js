import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ratnaya_super_secret_jwt_key_2026';

/**
 * Verify JWT Token Middleware
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied. Authorization token missing or malformed.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired Authorization Token. Please login again.',
      error: error.message
    });
  }
}

/**
 * Optional Auth Middleware (attaches req.user if token provided, but doesn't block if missing)
 */
export function optionalToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

/**
 * Authorize Roles Middleware
 */
export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access Forbidden. User role unrecognized.'
      });
    }

    const normalizedUserRole = req.user.role.toUpperCase();
    const normalizedAllowed = roles.map(r => r.toUpperCase());

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: `Access Forbidden. Role "${req.user.role}" does not have permission to access this resource.`
      });
    }




    // data set up for logging purposes
    // req.accessLog = {
    //   userId: req.user.id,
    //   userRole: req.user.role,
    //   allowedRoles: roles
    // };
    next();
  };
}
