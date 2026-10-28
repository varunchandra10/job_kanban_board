
const crypto = require('crypto');
const config = require('../config');
const { db } = require('../database/db');
const { signToken, verifyToken } = require('../services/jwtService');
const { hashPassword, verifyPassword } = require('../services/passwordService');
const { sendPasswordResetEmail } = require('../services/emailService');

/**
 * Get currently authenticated user details
 */
exports.me = (req, res) => {
  if (!req.user) {
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
  }

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
  const { email, name, password, pin } = req.body || {};
  const rawPassword = (password || pin || '').trim();

  // If PIN check is configured
  if (config.appPin) {
    if (!rawPassword || rawPassword !== config.appPin) {
      return res.status(401).json({ error: 'Incorrect PIN', pinRequired: true });
    }
  }

  // If user provided email
  if (email && typeof email === 'string' && email.includes('@')) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name || cleanEmail.split('@')[0]).trim();

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      if (!rawPassword || rawPassword.length < 6) {
        return res.status(400).json({ error: 'Please enter a password with at least 6 characters.' });
      }
      const id = 'usr_' + crypto.randomBytes(8).toString('hex');
      const passHash = hashPassword(rawPassword);
      db.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)').run(id, cleanEmail, cleanName, passHash);
      user = { id, email: cleanEmail, name: cleanName };
    } else {
      // Existing user: verify password if hash exists
      if (user.password_hash) {
        if (!rawPassword || !verifyPassword(rawPassword, user.password_hash)) {
          return res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
        }
      } else if (rawPassword) {
        // Set password for accounts previously without a password
        if (rawPassword.length < 6) {
          return res.status(400).json({ error: 'Please enter a password with at least 6 characters.' });
        }
        const passHash = hashPassword(rawPassword);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passHash, user.id);
      }
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
  try {
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
      const initialName = name || cleanEmail.split('@')[0];
      const initialPic = picture || '';
      db.prepare('INSERT INTO users (id, email, name, avatar_url) VALUES (?, ?, ?, ?)').run(
        id,
        cleanEmail,
        initialName,
        initialPic
      );
      user = { id, email: cleanEmail, name: initialName, avatar_url: initialPic };
    } else {
      let needsUpdate = false;
      let finalName = user.name || name || cleanEmail.split('@')[0];
      let finalPic = user.avatar_url || picture || '';

      if (picture && !user.avatar_url) {
        finalPic = picture;
        needsUpdate = true;
      }
      if (!user.name && name) {
        finalName = name;
        needsUpdate = true;
      }

      if (needsUpdate) {
        db.prepare('UPDATE users SET avatar_url = ?, name = ? WHERE id = ?').run(
          finalPic,
          finalName,
          user.id
        );
        user.avatar_url = finalPic;
        user.name = finalName;
      }
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name });

    return res.json({
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
  } catch (err) {
    console.error('[Google Auth Error]', err);
    return res.status(500).json({
      error: err.message || 'Error authenticating with Google'
    });
  }
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


const pendingDesktopAuth = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of pendingDesktopAuth.entries()) {
    if (value.expiresAt && value.expiresAt < now) {
      pendingDesktopAuth.delete(key);
    }
  }
}, 60000).unref();

exports.desktopGoogleStart = (req, res) => {
  const sessionId = req.query.sessionId || crypto.randomUUID();
  const host = (req.get('host') || '').toLowerCase();
  const isLocal = host.includes('127.0.0.1') || host.includes('localhost') || !host;
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';

  const clientId = isLocal ? config.googleDesktopClientId : (config.googleClientId || config.googleDesktopClientId);
  const redirectUri = isLocal
    ? `http://127.0.0.1:${config.port || 3000}/api/auth/google/callback`
    : `${protocol}://${host}/api/auth/google/callback`;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: sessionId,
    access_type: 'offline',
    prompt: 'select_account'
  }).toString();

  try {
    const { exec } = require('child_process');
    if (process.platform === 'win32') {
      exec(`start "" "${authUrl}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${authUrl}"`);
    } else {
      exec(`xdg-open "${authUrl}"`);
    }
  } catch (err) {
    console.warn('[Desktop OAuth] Could not auto-launch browser:', err.message);
  }

  res.json({ ok: 1, sessionId, url: authUrl });
};

exports.googleCallback = async (req, res) => {
  const { code, state: sessionId, error } = req.query;

  if (error || !code) {
    return res.status(400).send(`
      <!DOCTYPE html><html><body style="font-family:sans-serif;background:#09090b;color:#f87171;text-align:center;padding:50px;">
        <h2>Google Authentication Canceled</h2>
        <p>${error || 'No authorization code provided.'}</p>
        <p>You can close this tab and return to Job Tracker.</p>
      </body></html>
    `);
  }

  try {
    const host = (req.get('host') || '').toLowerCase();
    const isLocal = host.includes('127.0.0.1') || host.includes('localhost') || !host;
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';

    const clientId = isLocal ? config.googleDesktopClientId : (config.googleClientId || config.googleDesktopClientId);
    const clientSecret = isLocal ? config.googleDesktopClientSecret : (config.googleClientSecret || config.googleDesktopClientSecret);
    const redirectUri = isLocal
      ? `http://127.0.0.1:${config.port || 3000}/api/auth/google/callback`
      : `${protocol}://${host}/api/auth/google/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('[Google OAuth Callback] Token exchange failed:', tokenData);
      return res.status(400).send(`
        <!DOCTYPE html><html><body style="font-family:sans-serif;background:#09090b;color:#f87171;text-align:center;padding:50px;">
          <h2>Google Token Exchange Failed</h2>
          <p>${tokenData.error_description || tokenData.error || 'Could not verify authorization code.'}</p>
        </body></html>
      `);
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      return res.status(400).send('No email associated with Google profile.');
    }

    const cleanEmail = profile.email.toLowerCase().trim();
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      const id = 'usr_' + (profile.sub ? String(profile.sub).slice(0, 12) : crypto.randomBytes(8).toString('hex'));
      const initialName = profile.name || cleanEmail.split('@')[0];
      const initialPic = profile.picture || '';
      db.prepare('INSERT INTO users (id, email, name, avatar_url) VALUES (?, ?, ?, ?)').run(
        id,
        cleanEmail,
        initialName,
        initialPic
      );
      user = { id, email: cleanEmail, name: initialName, avatar_url: initialPic };
    } else {
      let needsUpdate = false;
      let finalName = user.name || profile.name || cleanEmail.split('@')[0];
      let finalPic = user.avatar_url || profile.picture || '';

      if (profile.picture && !user.avatar_url) {
        finalPic = profile.picture;
        needsUpdate = true;
      }
      if (!user.name && profile.name) {
        finalName = profile.name;
        needsUpdate = true;
      }

      if (needsUpdate) {
        db.prepare('UPDATE users SET avatar_url = ?, name = ? WHERE id = ?').run(
          finalPic,
          finalName,
          user.id
        );
        user.avatar_url = finalPic;
        user.name = finalName;
      }
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name });

    if (sessionId) {
      const userPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url || profile.picture || ''
      };

      try {
        db.exec(`
          CREATE TABLE IF NOT EXISTS pending_desktop_auth (
            session_id TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            user_json TEXT NOT NULL,
            created_at INTEGER NOT NULL
          );
        `);
        db.prepare(`
          INSERT INTO pending_desktop_auth (session_id, token, user_json, created_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(session_id) DO UPDATE SET token = excluded.token, user_json = excluded.user_json, created_at = excluded.created_at
        `).run(sessionId, token, JSON.stringify(userPayload), Date.now());
      } catch (dbErr) {
        console.warn('[Desktop OAuth DB Store Note]:', dbErr.message);
      }

      pendingDesktopAuth.set(sessionId, {
        token,
        user: userPayload,
        expiresAt: Date.now() + 180000
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Job Tracker - Authenticated</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #09090b; color: #f4f4f5; text-align: center; }
          .card { background: #18181b; padding: 48px 40px; border-radius: 20px; border: 1px solid #27272a; max-width: 440px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
          .icon { width: 68px; height: 68px; background: rgba(34,197,94,0.15); color: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 34px; border: 2px solid rgba(34,197,94,0.3); }
          h1 { margin: 0 0 12px; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
          p { color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
          .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; box-sizing: border-box; padding: 14px 20px; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; font-weight: 600; font-size: 14px; border-radius: 12px; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(59,130,246,0.3); transition: all 0.2s; margin-bottom: 20px; }
          .btn:hover { opacity: 0.95; transform: translateY(-1px); }
          .badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; background: #27272a; border-radius: 9999px; font-size: 13px; color: #e4e4e7; font-weight: 500; border: 1px solid #3f3f46; }
          .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>Signed In Successfully!</h1>
          <p>Authenticated as <strong>${profile.name || cleanEmail}</strong>.<br>You are now connected. Return to the Job Tracker desktop app.</p>
          <a href="jobtracker://auth?token=${encodeURIComponent(token)}" class="btn" id="openBtn">
            <span>Open Job Tracker Desktop</span> &rarr;
          </a>
          <div>
            <div class="badge"><span class="dot"></span>Desktop App Connected</div>
          </div>
        </div>
        <script>
          try {
            window.location.href = "jobtracker://auth?token=" + encodeURIComponent("${token}");
          } catch (_) {}
          setTimeout(() => { try { window.close(); } catch(e) {} }, 4000);
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[Google OAuth Callback Error]:', err);
    res.status(500).send(`
      <!DOCTYPE html><html><body style="font-family:sans-serif;background:#09090b;color:#f87171;text-align:center;padding:50px;">
        <h2>Authentication Server Error</h2>
        <p>${err.message}</p>
      </body></html>
    `);
  }
};

exports.desktopGooglePoll = (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.json({ ok: 1, ready: false });
  }

  // 1. Primary check: Persistent SQLite / Turso edge database
  try {
    const row = db.prepare('SELECT token, user_json FROM pending_desktop_auth WHERE session_id = ?').get(sessionId);
    if (row && row.token) {
      try {
        db.prepare('DELETE FROM pending_desktop_auth WHERE session_id = ?').run(sessionId);
      } catch (_) {}
      return res.json({
        ok: 1,
        ready: true,
        token: row.token,
        user: JSON.parse(row.user_json)
      });
    }
  } catch (err) {
    console.warn('[Desktop Poll Database Check Note]:', err.message);
  }

  // 2. Fallback check: In-memory store (for single-instance local runs)
  if (pendingDesktopAuth.has(sessionId)) {
    const data = pendingDesktopAuth.get(sessionId);
    pendingDesktopAuth.delete(sessionId);
    return res.json({
      ok: 1,
      ready: true,
      token: data.token,
      user: data.user
    });
  }

  res.json({ ok: 1, ready: false });
};

/**
 * Request password reset verification code
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email address.' });
    }

    // Generate cryptographically secure 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    // Ensure table exists & store code
    db.prepare(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

    db.prepare('DELETE FROM password_resets WHERE email = ?').run(cleanEmail);
    db.prepare('INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?)').run(cleanEmail, code, expiresAt);

    // Send email using nodemailer Gmail SMTP
    await sendPasswordResetEmail(cleanEmail, code);

    return res.json({
      ok: 1,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox and spam folder.`
    });
  } catch (err) {
    console.error('[Auth Controller] forgotPassword error:', err);
    return res.status(500).json({ error: err.message || 'Failed to dispatch verification code. Please check SMTP configuration.' });
  }
};

/**
 * Verify code and reset password
 */
exports.resetPassword = (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = String(code).trim();
    const rawPassword = String(newPassword).trim();

    if (rawPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const resetRecord = db.prepare('SELECT * FROM password_resets WHERE email = ? AND code = ?').get(cleanEmail, cleanCode);
    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid verification code. Please double check and try again.' });
    }

    if (Date.now() > resetRecord.expires_at) {
      db.prepare('DELETE FROM password_resets WHERE id = ?').run(resetRecord.id);
      return res.status(400).json({ error: 'Verification code has expired (15 minute limit). Please request a new code.' });
    }

    // Hash and update password
    const passHash = hashPassword(rawPassword);
    db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(passHash, cleanEmail);

    // Clear reset code
    db.prepare('DELETE FROM password_resets WHERE email = ?').run(cleanEmail);

    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(cleanEmail);
    const token = signToken({ id: user.id, email: user.email, name: user.name });

    return res.json({
      ok: 1,
      message: 'Password reset successfully! You are now signed in.',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('[Auth Controller] resetPassword error:', err);
    return res.status(500).json({ error: err.message || 'Failed to reset password.' });
  }
};

