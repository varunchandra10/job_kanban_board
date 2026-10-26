const config = require('../config');
const { verifyToken } = require('../services/jwtService');

function authMiddleware(req, res, next) {
  // Try to parse user token if present on ANY request
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

  const fullPath = (req.originalUrl || req.url || req.path || '').split('?')[0];

  // Auth endpoints, health checks, vendor assets do not require prior login
  if (
    fullPath.startsWith('/api/auth/') ||
    req.path.startsWith('/auth/') ||
    fullPath === '/api/health' ||
    req.path === '/health' ||
    fullPath.startsWith('/vendor/') ||
    req.path.startsWith('/vendor/')
  ) {
    return next();
  }

  // If user successfully authenticated via JWT
  if (req.user && req.user.id) {
    return next();
  }

  // Local development / single-user desktop fallback when no PIN is configured
  if (!config.isVercel && !config.appPin && (!req.user || !req.user.id)) {
    let defaultUser = null;
    try {
      const { db } = require('../database/db');
      defaultUser = db.prepare("SELECT id, email, name FROM users WHERE id = 'default_user'").get();
      if (!defaultUser) {
        db.prepare("INSERT OR IGNORE INTO users (id, email, name) VALUES ('default_user', 'local@jobtracker.app', 'Default User')").run();
        defaultUser = { id: 'default_user', email: 'local@jobtracker.app', name: 'Default User' };
      }
    } catch (_) {
      defaultUser = { id: 'default_user', email: 'local@jobtracker.app', name: 'Default User' };
    }
    req.user = defaultUser;
    return next();
  }

  // Read-only calls when logged out / unauthenticated:
  // Allow them to proceed with req.user = null so controllers return empty/zero data
  const readOnlyPaths = [
    '/api/state', '/api/learnings', '/api/gamification', '/api/storage/status', '/api/file-content',
    '/state', '/learnings', '/gamification', '/storage/status', '/file-content'
  ];
  if (req.method === 'GET' && (readOnlyPaths.includes(fullPath) || readOnlyPaths.includes(req.path))) {
    req.user = req.user || null;
    return next();
  }

  // Any modifying API action requires authentication
  return res.status(401).json({
    error: 'Authentication required. Please log in.',
    loggedOut: true
  });
}

module.exports = authMiddleware;