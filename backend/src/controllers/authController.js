const crypto = require('crypto');
const config = require('../config');

const activeTokens = new Set();

exports.login = (req, res) => {
  if (!config.appPin) {
    return res.json({ ok: 1, message: 'Authentication disabled (local access mode)' });
  }
  const { pin } = req.body;
  if (!pin || String(pin).trim() !== config.appPin) {
    return res.status(401).json({ error: 'Incorrect PIN' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.add(token);
  res.json({ ok: 1, token, message: 'Authenticated successfully' });
};

exports.status = (req, res) => {
  if (!config.appPin) {
    return res.json({ pinRequired: false, authenticated: true });
  }
  const token = req.headers['authorization']?.replace(/^Bearer\s+/i, '') || req.headers['x-app-pin'];
  const isValid = token && (token === config.appPin || activeTokens.has(token));
  res.json({ pinRequired: true, authenticated: !!isValid });
};

exports.logout = (req, res) => {
  const token = req.headers['authorization']?.replace(/^Bearer\s+/i, '');
  if (token) activeTokens.delete(token);
  res.json({ ok: 1 });
};

exports.isValidToken = (token) => {
  if (!config.appPin) return true;
  if (!token) return false;
  return token === config.appPin || activeTokens.has(token);
};
