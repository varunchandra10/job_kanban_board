const rateLimit = require('express-rate-limit');

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 300;
  const message = options.message || { error: 'Too many requests, please slow down.' };
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits.entries()) {
      const valid = timestamps.filter(t => now - t < windowMs);
      if (valid.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, valid);
      }
    }
  }, 2 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const timestamps = (hits.get(ip) || []).filter(t => now - t < windowMs);

    if (timestamps.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json(message);
    }

    timestamps.push(now);
    hits.set(ip, timestamps);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - timestamps.length));
    next();
  };
}

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Maximum 5 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  skip: () => process.env.DISABLE_IP_RATE_LIMIT === 'true',
  message: {
    error: 'Too many password reset requests from this IP address. Please try again after 15 minutes.'
  }
});

module.exports = {
  createRateLimiter,
  passwordResetLimiter
};
