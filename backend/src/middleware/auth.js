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

  // Read-only calls when logged out / unauthenticated:
  // Allow them to proceed with req.user = null so controllers return empty/zero data
  if (req.method === 'GET' && ['/api/state', '/api/learnings', '/api/gamification', '/api/storage/status'].includes(req.path)) {
    req.user = null;
    return next();
  }

  // Any modifying API action requires authentication
  return res.status(401).json({
    error: 'Authentication required. Please log in.',
    loggedOut: true
  });
}

module.exports = authMiddleware;
