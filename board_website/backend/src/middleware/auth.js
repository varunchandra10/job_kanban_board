const config = require('../config');
const { verifyToken } = require('../services/jwtService');

function authMiddleware(req, res, next) {
  // Try to parse user token if present on ANY request
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.headers?.['x-auth-token'] || req.query?.token);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.id) {
      req.user = decoded;
    }
  }

  const fullPath = (req.originalUrl || req.url || req.path || '').split('?')[0];
  const reqPath = req.path || fullPath;

  // Auth endpoints, health checks, vendor assets do not require prior login
  if (
    fullPath.startsWith('/api/auth/') ||
    reqPath.startsWith('/auth/') ||
    fullPath === '/api/health' ||
    reqPath === '/health' ||
    fullPath.startsWith('/vendor/') ||
    reqPath.startsWith('/vendor/')
  ) {
    return next();
  }

  // If user successfully authenticated via JWT
  if (req.user && req.user.id) {
    // If token is scoped strictly for file viewing, reject any non-file-view endpoint
    if (req.user.scope === 'file_view') {
      const isFileViewPath =
        fullPath.startsWith('/api/file-content') ||
        fullPath.startsWith('/api/document-content') ||
        reqPath.startsWith('/file-content') ||
        reqPath.startsWith('/document-content');
      if (!isFileViewPath) {
        return res.status(403).json({ error: 'Scoped file viewing token cannot access this endpoint.' });
      }
    }
    return next();
  }

  // Read-only calls when logged out / unauthenticated:
  // Allow them to proceed with req.user = null so controllers return empty/zero data
  const readOnlyPaths = [
    '/api/state', '/api/learnings', '/api/gamification', '/api/storage/status', '/api/storage/local-info',
    '/state', '/learnings', '/gamification', '/storage/status', '/storage/local-info'
  ];
  if (req.method === 'GET' && (readOnlyPaths.includes(fullPath) || readOnlyPaths.includes(req.path))) {
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