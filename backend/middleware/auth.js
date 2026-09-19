const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Acces refuzat. Token lipsă.', code: 'UNAUTHORIZED' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Sesiune expirată. Te rugăm să te autentifici din nou.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Token invalid sau expirat.', code: 'INVALID_TOKEN' });
    }
    
    req.user = user;
    next();
  });
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Acces interzis. Rol insuficient.', code: 'FORBIDDEN' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };
