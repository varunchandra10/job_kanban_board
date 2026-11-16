/**
 * Security, URL Sanitization (CWE-79) & Client-Side Credential Cryptography (CWE-312)
 *
 * 1. sanitizeUrl: Neutralizes XSS via dangerous schemes (javascript:, data:, vbscript:).
 * 2. encryptClientSecret / decryptClientSecret: Client-side AES-256-GCM encryption
 *    protecting company job portal passwords at rest in localStorage.
 */

import { Application } from '../types';

export function sanitizeUrl(url?: string | null): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#') return '#';

  // Explicitly safe schemes: http, https, mailto, tel
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    // Reject strings with embedded control characters or null bytes
    if (/[\0\x00-\x1F]/.test(trimmed)) {
      return '#';
    }
    return trimmed;
  }

  // Strip any leading dangerous or unknown scheme(s) (e.g., javascript:, data:, vbscript:)
  // Handles nested or repetitive schemes (e.g. javascript:javascript:alert(1))
  const stripped = trimmed.replace(/^([a-zA-Z0-9+.-]+:)+/, '');
  if (!stripped || stripped === '#') return '#';

  // Return safe https-prefixed URL
  return `https://${stripped}`;
}

function uint8ToBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  const nodeBuf = (globalThis as any).Buffer;
  if (nodeBuf) {
    return nodeBuf.from(bytes).toString('base64');
  }
  return '';
}

function base64ToUint8(b64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  const nodeBuf = (globalThis as any).Buffer;
  if (nodeBuf) {
    return new Uint8Array(nodeBuf.from(b64, 'base64'));
  }
  return new Uint8Array();
}

/**
 * Encrypts a sensitive plaintext string (such as job portal password) at rest
 * using Web Crypto API AES-256-GCM tied to the user's active session token.
 */
export async function encryptClientSecret(plainText: string, secretKey?: string): Promise<string> {
  if (!plainText) return '';
  const keySource = secretKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null) || 'job_tracker_client_salt';
  try {
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
    if (!cryptoObj?.subtle) return plainText;

    const enc = new TextEncoder();
    const rawKey = await cryptoObj.subtle.digest('SHA-256', enc.encode(keySource + ':portal_client_salt_v1'));
    const key = await cryptoObj.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt']);
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));
    const cipherBuffer = await cryptoObj.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText));

    const b64Iv = uint8ToBase64(iv);
    const b64Cipher = uint8ToBase64(new Uint8Array(cipherBuffer));
    return `enc:v1:${b64Iv}:${b64Cipher}`;
  } catch (err) {
    console.warn('[Security] Client secret encryption failed:', err);
    return plainText;
  }
}

/**
 * Decrypts an encrypted secret from localStorage back to plaintext in memory
 * using Web Crypto API AES-256-GCM with the active user session token.
 */
export async function decryptClientSecret(cipherText: string, secretKey?: string): Promise<string> {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc:v1:')) return cipherText; // Return legacy plaintext as-is
  const keySource = secretKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null) || 'job_tracker_client_salt';
  try {
    const parts = cipherText.split(':');
    if (parts.length < 4) return '';
    const b64Iv = parts[2];
    const b64Cipher = parts[3];

    const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
    if (!cryptoObj?.subtle) return '';

    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const rawKey = await cryptoObj.subtle.digest('SHA-256', enc.encode(keySource + ':portal_client_salt_v1'));
    const key = await cryptoObj.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['decrypt']);
    const iv = base64ToUint8(b64Iv);
    const cipherData = base64ToUint8(b64Cipher);

    const decryptedBuffer = await cryptoObj.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherData);
    return dec.decode(decryptedBuffer);
  } catch (err) {
    // Decryption failed (e.g. invalid key, session rotated, or corrupt payload)
    return '';
  }
}

/**
 * Sanitizes application objects prior to writing to localStorage by encrypting any raw portal passwords.
 */
export async function encryptApplicationsForStorage(apps: Application[], secretKey?: string): Promise<Application[]> {
  return Promise.all(
    apps.map(async app => {
      if (!app.portal_pass || app.portal_pass.startsWith('enc:v1:')) {
        return app;
      }
      const encrypted = await encryptClientSecret(app.portal_pass, secretKey);
      return {
        ...app,
        portal_pass: encrypted,
      };
    })
  );
}

/**
 * Restores applications from localStorage into memory by decrypting any AES-GCM ciphertexts.
 */
export async function decryptApplicationsFromStorage(apps: Application[], secretKey?: string): Promise<Application[]> {
  return Promise.all(
    apps.map(async app => {
      if (!app.portal_pass || !app.portal_pass.startsWith('enc:v1:')) {
        return app;
      }
      const decrypted = await decryptClientSecret(app.portal_pass, secretKey);
      return {
        ...app,
        portal_pass: decrypted,
      };
    })
  );
}
