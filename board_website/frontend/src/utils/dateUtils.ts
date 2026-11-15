/**
 * Date & Timezone Utilities
 * Prevents UTC vs Local date skew across international timezones
 * (e.g. Asia/Kolkata UTC+05:30, America/Los_Angeles UTC-08:00).
 */

/**
 * Resolves the client's current IANA timezone name (e.g. "Asia/Kolkata", "America/New_York").
 * Defaults to "UTC" if resolution fails.
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Formats a Date object to YYYY-MM-DD according to local calendar date
 * rather than UTC date (preventing 1-day drift from new Date().toISOString().slice(0, 10)).
 */
export function getLocalIsoDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the Monday Date (at 00:00:00.000 local) for the ISO week of the given date.
 */
export function getMondayOfWeek(d: Date = new Date()): Date {
  const result = new Date(d);
  const day = result.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Returns the Sunday Date (at 23:59:59.999 local) for the ISO week of the given date.
 */
export function getSundayOfWeek(d: Date = new Date()): Date {
  const monday = getMondayOfWeek(d);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}
