const crypto = require('crypto');

/**
 * Hash a password using Node.js native scrypt with a random salt.
 * Output format: scrypt:salt:derivedKeyHex
 */
function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password.normalize('NFKC'), salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024
  });
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a plaintext password against a stored hash string.
 * Uses timingSafeEqual to prevent timing attacks.
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') {
    return false;
  }
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return false;
    }
    const salt = parts[1];
    const originalKey = Buffer.from(parts[2], 'hex');
    const derivedKey = crypto.scryptSync(password.normalize('NFKC'), salt, originalKey.length, {
      N: 16384,
      r: 8,
      p: 1,
      maxmem: 32 * 1024 * 1024
    });
    return crypto.timingSafeEqual(originalKey, derivedKey);
  } catch (err) {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword
};
