/**
 * Security & URL Sanitization Utilities (CWE-79 Defense)
 * Prevents stored and DOM-based Cross-Site Scripting (XSS) via dangerous pseudo-protocols
 * such as javascript:, vbscript:, and data:.
 */

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
