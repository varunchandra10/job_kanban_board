const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Resolves the persistent portal credentials encryption secret.
 * 1. Checks process.env.PORTAL_CREDENTIALS_SECRET
 * 2. Checks for a persisted .portal_key secret file
 * 3. Generates and persists a dedicated 256-bit random key that survives JWT secret rotations
 */
function resolvePortalSecret() {
  if (process.env.PORTAL_CREDENTIALS_SECRET && process.env.PORTAL_CREDENTIALS_SECRET.trim()) {
    return process.env.PORTAL_CREDENTIALS_SECRET.trim();
  }

  const keyCandidates = [
    path.join(config.dataDir || '', '.portal_key'),
    path.join(config.backendDir || '', '.portal_key'),
    path.resolve(__dirname, '../../.portal_key')
  ];

  for (const candidate of keyCandidates) {
    if (candidate && fs.existsSync(candidate)) {
      try {
        const stored = fs.readFileSync(candidate, 'utf8').trim();
        if (stored.length >= 32) {
          return stored;
        }
      } catch (_) {}
    }
  }

  // Generate and persist a brand-new independent 32-byte (64 hex characters) key
  const generatedSecret = crypto.randomBytes(32).toString('hex');
  const targetPath = keyCandidates[0] || path.resolve(__dirname, '../../.portal_key');
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(targetPath, generatedSecret, { mode: 0o600 });
    console.log(`[Crypto Service] Generated and saved independent encryption key: ${targetPath}`);
  } catch (err) {
    console.warn('[Crypto Service] Note: Could not save .portal_key to disk:', err.message);
  }

  return generatedSecret;
}

const activeSecret = resolvePortalSecret();
const encryptionKey = crypto.createHash('sha256').update(activeSecret + ':portal_credentials_salt_v1').digest();

// Dynamic fallback keys derived from config.jwtSecret and the legacy default for backward-compatibility with existing database ciphertexts
function getLegacyFallbackKeys() {
  const keys = [];
  if (config.jwtSecret) {
    keys.push(crypto.createHash('sha256').update(config.jwtSecret + ':portal_credentials_salt_v1').digest());
  }
  keys.push(crypto.createHash('sha256').update('job-tracker-dev-portal-secret-key:portal_credentials_salt_v1').digest());
  return keys;
}

/**
 * Encrypts a sensitive string (e.g. portal password) using AES-256-GCM.
 * Format: enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 *
 * @param {string} plainText
 * @returns {string} Encrypted ciphertext token or empty string
 */
function encryptCredential(plainText) {
  if (!plainText || typeof plainText !== 'string') return '';
  const trimmed = plainText.trim();
  if (!trimmed) return '';

  // Already encrypted
  if (trimmed.startsWith('enc:v1:')) return trimmed;

  try {
    // 12-byte IV standard for GCM mode
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
    let encrypted = cipher.update(trimmed, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `enc:v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('[Crypto Service] Encryption failure:', err.message);
    throw err;
  }
}

/**
 * Decrypts an AES-256-GCM encrypted credential token.
 * Falls back to returning plainText as-is if unencrypted for seamless backward compatibility.
 *
 * @param {string} cipherText
 * @returns {string} Plaintext credential or empty string if corrupted
 */
function decryptCredential(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') return '';
  const trimmed = cipherText.trim();
  if (!trimmed) return '';

  // Return unencrypted plaintext directly for backward compatibility
  if (!trimmed.startsWith('enc:v1:')) {
    return trimmed;
  }

  const parts = trimmed.split(':');
  // Format must match: ['enc', 'v1', ivHex, authTagHex, ciphertextHex]
  if (parts.length !== 5) {
    console.warn('[Crypto Service] Malformed encrypted token structure');
    return '';
  }

  try {
    const iv = Buffer.from(parts[2], 'hex');
    const authTag = Buffer.from(parts[3], 'hex');
    const ciphertextHex = parts[4];

    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (primaryErr) {
      const fallbackKeys = getLegacyFallbackKeys();
      for (const fallbackKey of fallbackKeys) {
        try {
          const fallbackDecipher = crypto.createDecipheriv('aes-256-gcm', fallbackKey, iv);
          fallbackDecipher.setAuthTag(authTag);
          let decryptedFallback = fallbackDecipher.update(ciphertextHex, 'hex', 'utf8');
          decryptedFallback += fallbackDecipher.final('utf8');
          return decryptedFallback;
        } catch (_) {}
      }
      throw primaryErr;
    }
  } catch (err) {
    console.warn('[Crypto Service] Decryption failed or authentication tag mismatch:', err.message);
    return '';
  }
}

/**
 * Automatically encrypts any legacy plaintext portal passwords present in the database.
 * Safe to execute on every server startup (idempotent).
 *
 * @param {object} dbInstance Database handle
 */
function migratePlaintextCredentials(dbInstance) {
  if (!dbInstance || typeof dbInstance.prepare !== 'function') return;
  try {
    const rows = dbInstance.prepare("SELECT id, portal_pass FROM applications WHERE portal_pass IS NOT NULL AND portal_pass != ''").all();
    let count = 0;
    const updateStmt = dbInstance.prepare('UPDATE applications SET portal_pass = ? WHERE id = ?');

    for (const r of rows) {
      if (r.portal_pass && typeof r.portal_pass === 'string' && !r.portal_pass.startsWith('enc:v1:')) {
        const encrypted = encryptCredential(r.portal_pass);
        updateStmt.run(encrypted, r.id);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[Crypto Service] Successfully encrypted ${count} legacy portal password(s) with AES-256-GCM.`);
    }
  } catch (err) {
    console.warn('[Crypto Service] Legacy portal password migration warning:', err.message);
  }
}

module.exports = {
  encryptCredential,
  decryptCredential,
  migratePlaintextCredentials
};

