function sanitizeString(val) {
  if (typeof val !== 'string') return val;
  return val.replace(/\0/g, '').trim();
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  next();
}

function validateIdParam(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid ID parameter. Must be a positive integer.' });
  }
  next();
}

function validateCreateApplication(req, res, next) {
  if (!req.body || !req.body.company || !String(req.body.company).trim()) {
    return res.status(400).json({ error: 'Company name is required.' });
  }
  next();
}

module.exports = {
  sanitizeBody,
  validateIdParam,
  validateCreateApplication
};
