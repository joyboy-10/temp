const authService = require('../services/auth');

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Role-based authorization middleware
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Institution access middleware
function requireInstitutionAccess(req, res, next) {
  const institutionId = req.params.institutionId || req.body.institutionId;
  
  if (!institutionId) {
    return res.status(400).json({ error: 'Institution ID required' });
  }

  if (req.user.institutionId !== institutionId) {
    return res.status(403).json({ error: 'Access denied to this institution' });
  }

  next();
}

module.exports = {
  authenticateToken,
  requireRole,
  requireInstitutionAccess
};