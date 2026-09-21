const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  if (issuedBeforePasswordChange(decoded)) {
    return res.status(401).json({ message: 'Your password was changed. Please sign in again.' });
  }
  req.user = decoded; // { id, email, role, name }
  next();
}

// A password reset signs out every session that existed before it
function issuedBeforePasswordChange(decoded) {
  const db = require('../db/store');
  const account = decoded.role === 'vendor' ? db.getVendorById(decoded.id) : db.getUserById(decoded.id);
  return !!account?.passwordChangedAt && decoded.iat < Math.floor(account.passwordChangedAt / 1000);
}

// Sets req.user when a valid token is sent; continues as a guest otherwise
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try { req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET); } catch {}
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

module.exports = { authMiddleware, optionalAuth, requireRole };
