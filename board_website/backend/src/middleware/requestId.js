const crypto = require('crypto');

/**
 * Middleware that assigns or preserves a unique correlation ID for every HTTP request.
 * Sets X-Request-Id response header and exposes req.id for structured error logging.
 */
function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const requestId = (incomingId && typeof incomingId === 'string' && incomingId.trim().length <= 64)
    ? incomingId.trim()
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Structured logging helper scoped to this specific request
  req.log = (message, level = 'info') => {
    const timestamp = new Date().toISOString();
    const logFn = console[level] || console.log;
    logFn(`[${timestamp}] [req:${requestId}] ${message}`);
  };

  next();
}

module.exports = requestIdMiddleware;

