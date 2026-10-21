const config = require('../config');
const { isValidToken } = require('../controllers/authController');

function authMiddleware(req, res, next) {
  if (!config.appPin) return next();

  const publicPaths = ['/', '/index.html', '/style.css', '/logos.json', '/health', '/api/auth/login', '/api/auth/status'];
  if (publicPaths.includes(req.path) || req.path.startsWith('/vendor/')) {
    return next();
  }

  const token = req.headers['authorization']?.replace(/^Bearer\s+/i, '')
    || req.headers['x-app-pin']
    || req.query.pin;

  if (isValidToken(token)) return next();

  return res.status(401).json({
    error: 'PIN authorization required',
    pinRequired: true
  });
}

module.exports = authMiddleware;
