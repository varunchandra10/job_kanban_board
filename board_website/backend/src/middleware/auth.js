const config = require('../config');
const { verifyToken } = require('../services/jwtService');

function authMiddleware(req, res, next) {
  const fullPath = (req.originalUrl || req.url || req.path || '').split('?')[0];
  const reqPath = req.path || fullPath;

  const isFileViewPath =
    fullPath.startsWith('/api/file-content') ||
    fullPath.startsWith('/api/document-content') ||
    /^\/api\/versions\/\d+\/pdf(\/|$)/.test(fullPath) ||
    reqPath.startsWith('/file-content') ||
    reqPath.startsWith('/document-content') ||
    /^\/versions\/\d+\/pdf(\/|$)/.test(reqPath);

  // Parse token: standard Authorization header or x-auth-token header are accepted across all routes.
  // Query-string tokens (?token=...) are strictly restricted to file viewing & streaming endpoints
  // where native HTML elements (<a>, <iframe>) cannot easily transmit custom HTTP headers.
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers?.['x-auth-token']) {
    token = String(req.headers['x-auth-token']).trim();
  } else if (isFileViewPath && req.query?.token) {
    token = String(req.query.token).trim();
  }

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.id) {
      req.user = decoded;
    }
  }

  // Always allow CORS pre-flight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Auth endpoints, health checks, public portfolio, vendor assets do not require prior login
  if (
    fullPath.startsWith('/api/auth/') ||
    reqPath.startsWith('/auth/') ||
    fullPath.startsWith('/api/portfolio') ||
    reqPath.startsWith('/portfolio') ||
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
      if (!isFileViewPath) {
        return res.status(403).json({ error: 'Scoped file viewing token cannot access this endpoint.' });
      }
    }
    return next();
  }

  // Read-only calls when logged out / unauthenticated:
  // Allow them to proceed with req.user = null so controllers return empty/zero data
  const readOnlyPaths = [
    '/api/state', '/api/learnings', '/api/gamification', '/api/storage/status', '/api/storage/local-info', '/api/dsa/progress',
    '/api/weekly-chest/current', '/api/weekly-chest/vault',
    '/state', '/learnings', '/gamification', '/storage/status', '/storage/local-info', '/dsa/progress',
    '/weekly-chest/current', '/weekly-chest/vault'
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