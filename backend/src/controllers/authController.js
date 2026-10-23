const crypto = require('crypto');
const config = require('../config');
const { db } = require('../database/db');
const { signToken, verifyToken } = require('../services/jwtService');

/**
 * Get currently authenticated user details
 */
exports.me = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = db.prepare('SELECT id, email, name, avatar_url, google_refresh_token, gdrive_folder_id, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.json({
        user: {
          id: req.user.id,
          email: req.user.email || 'local@jobtracker.app',
          name: req.user.name || 'Default User',
          avatar_url: '',
          has_gdrive: false
        }
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        avatar_url: user.avatar_url || '',
        has_gdrive: !!user.google_refresh_token,
        gdrive_folder_id: user.gdrive_folder_id || '',
        created_at: user.created_at
      }
    });
  } catch (err) {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email || 'local@jobtracker.app',
        name: req.user.name || 'Default User',
        avatar_url: '',
        has_gdrive: false
      }
    });
  }
};

/**
 * Login / Register via Email or PIN
 */
exports.login = (req, res) => {
  const { email, name, pin } = req.body || {};

  // If PIN check is configured
  if (config.appPin) {
    if (!pin || String(pin).trim() !== config.appPin) {
      return res.status(401).json({ error: 'Incorrect PIN', pinRequired: true });
    }
  }

  // If user provided email
  if (email && typeof email === 'string' && email.includes('@')) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name || cleanEmail.split('@')[0]).trim();

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      const id = 'usr_' + crypto.randomBytes(8).toString('hex');
      db.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)').run(id, cleanEmail, cleanName);
      user = { id, email: cleanEmail, name: cleanName };
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    return res.json({
      ok: 1,
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  }

  // Default user login (local mode)
  let defaultUser = db.prepare('SELECT * FROM users WHERE id = ?').get('default_user');
  if (!defaultUser) {
    db.prepare("INSERT OR IGNORE INTO users (id, email, name) VALUES ('default_user', 'local@jobtracker.app', 'Default User')").run();
    defaultUser = { id: 'default_user', email: 'local@jobtracker.app', name: 'Default User' };
  }

  const token = signToken({ id: defaultUser.id, email: defaultUser.email, name: defaultUser.name });
  res.json({
    ok: 1,
    token,
    user: { id: defaultUser.id, email: defaultUser.email, name: defaultUser.name }
  });
};

/**
 * Status of authentication (for frontend initial check)
 */
exports.status = (req, res) => {
  const pinRequired = !!config.appPin;
  const user = req.user || null;
  res.json({
    pinRequired,
    authenticated: !!user,
    user: user ? { id: user.id, email: user.email, name: user.name } : null
  });
};

/**
 * Google OAuth verification / sign-in endpoint
 */
exports.googleAuth = async (req, res) => {
  const { credential, profile } = req.body || {};

  let email = profile?.email;
  let name = profile?.name;
  let picture = profile?.picture;
  let googleId = profile?.sub;

  if (credential && !email) {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
        googleId = payload.sub;
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid Google credential' });
    }
  }

  if (!email) {
    return res.status(400).json({ error: 'Google email is required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

  if (!user) {
    const id = 'usr_' + (googleId ? String(googleId).slice(0, 12) : crypto.randomBytes(8).toString('hex'));
    db.prepare('INSERT INTO users (id, email, name, avatar_url) VALUES (?, ?, ?, ?)').run(
      id,
      cleanEmail,
      name || cleanEmail.split('@')[0],
      picture || ''
    );
    user = { id, email: cleanEmail, name: name || cleanEmail.split('@')[0], avatar_url: picture || '' };
  } else if (picture && !user.avatar_url) {
    db.prepare('UPDATE users SET avatar_url = ?, name = COALESCE(NULLIF(name, ""), ?) WHERE id = ?').run(
      picture,
      name || '',
      user.id
    );
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name });

  res.json({
    ok: 1,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url || picture || '',
      has_gdrive: !!user.google_refresh_token
    }
  });
};

/**
 * Logout
 */
exports.logout = (req, res) => {
  res.json({ ok: 1 });
};

/**
 * Helper to validate token
 */
exports.isValidToken = (token) => {
  return !!verifyToken(token);
};
