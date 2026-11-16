/**
 * Monotonic & UUID Collision-Proof ID Generation Utilities
 * Prevents race-condition ID collisions during rapid creation bursts
 * (e.g. batch clipping, automated imports, rapid user clicks).
 */

let lastMonotonicId = 0;

/**
 * Generates a strictly increasing, collision-proof numeric ID.
 * Even if called thousands of times within the exact same millisecond,
 * each ID is guaranteed to be unique and strictly monotonic.
 */
export function generateTempNumericId(): number {
  const now = Date.now();
  if (now <= lastMonotonicId) {
    lastMonotonicId += 1;
  } else {
    lastMonotonicId = now;
  }
  return lastMonotonicId;
}

/**
 * Generates a cryptographically strong UUID or prefixed unique string ID.
 */
export function generateUniqueStringId(prefix?: string): string {
  const p = prefix ? `${prefix}-` : '';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${p}${crypto.randomUUID()}`;
  }
  return `${p}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

