const config = require('../config');
const { verifyToken } = require('../services/jwtService');

function authMiddleware(req, res, next) {
  // Public static assets and unauthenticated endpoints
  const publicPaths = [
    '/',
    '/index.html',
    '/profile.html',
    '/learnings.html',
    '/style.css',
    '/app.js',
    '/learnings.js',
    '/logos.json',
    '/health',
    '/api/auth/login',
    '/api/auth/status',
    '/api/auth/google'
  ];

  // Try to parse user token if present on any request
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.headers['x-auth-token'] || req.query.token);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.id) {
      req.user = decoded;
    }
  }

  if (publicPaths.includes(req.path) || req.path.startsWith('/vendor/')) {
    return next();
  }

  // If user successfully authenticated via JWT
  if (req.user && req.user.id) {
    return next();
  }

  // If local access mode without PIN, allow as default_user
  if (!config.appPin) {
    req.user = {
      id: 'default_user',
      email: 'local@jobtracker.app',
      name: 'Default User'
    };
    return next();
  }

  return res.status(401).json({
    error: 'Authorization required',
    pinRequired: true
  });
}

module.exports = authMiddleware;
