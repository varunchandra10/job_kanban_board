const crypto = require('crypto');
const config = require('../config');

// Dedicated key derivation with domain separation
const secret = process.env.PORTAL_CREDENTIALS_SECRET || config.jwtSecret || 'job-tracker-dev-portal-secret-key';
const encryptionKey = crypto.createHash('sha256').update(secret + ':portal_credentials_salt_v1').digest();

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

    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
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

