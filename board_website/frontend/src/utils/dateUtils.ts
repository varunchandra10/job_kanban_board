/**
 * Date & Timezone Utilities
 * Prevents UTC vs Local date skew across international timezones
 * (e.g. Asia/Kolkata UTC+05:30, America/Los_Angeles UTC-08:00).
 */

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DAY_NAMES_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

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

/**
 * Parses year, 1-indexed month, and day from an ISO date string (YYYY-MM-DD),
 * ISO timestamp, or Date instance without UTC date skew.
 */
export function parseDateParts(
  dateInput?: string | Date | null
): { year: number; month: number; day: number } | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return {
      year: dateInput.getFullYear(),
      month: dateInput.getMonth() + 1,
      day: dateInput.getDate(),
    };
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateInput).trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export interface FormatDateOptions {
  includeYear?: boolean;
  fallback?: string;
  monthFormat?: 'short' | 'full';
}

/**
 * Centralized date formatter across Kanban, Learning Cards, and Heatmap components.
 * Formats "2026-11-16" -> "Nov 16, 2026" (default) or "Nov 16" (when includeYear: false).
 */
export function formatDate(
  dateInput?: string | Date | null,
  options?: FormatDateOptions | boolean
): string {
  const opts: FormatDateOptions =
    typeof options === 'boolean' ? { includeYear: options } : options || {};
  const includeYear = opts.includeYear !== false;
  const fallback = opts.fallback ?? '';
  const monthFormat = opts.monthFormat ?? 'short';

  const parts = parseDateParts(dateInput);
  if (!parts) {
    if (!dateInput) return fallback;
    return String(dateInput);
  }

  const { year, month, day } = parts;
  const monthName =
    monthFormat === 'full'
      ? MONTH_NAMES_FULL[month - 1] || ''
      : MONTH_NAMES_SHORT[month - 1] || '';

  if (!includeYear) {
    return `${monthName} ${day}`;
  }
  return `${monthName} ${day}, ${year}`;
}

export interface DateLabelInputObject {
  year: number;
  month: number;
  day?: number;
  dayNumber?: number;
  dayOfWeek?: number;
}

/**
 * Formats a full date label with weekday for tooltips and heatmaps.
 * E.g., "Monday, November 16, 2026" or "Monday, Nov 16, 2026"
 */
export function formatFullDateLabel(
  dateInput?: string | Date | DateLabelInputObject | null,
  options?: { fullMonth?: boolean; fallback?: string }
): string {
  const fallback = options?.fallback ?? '';
  if (!dateInput) return fallback;

  let y: number;
  let m: number; // 1-indexed
  let d: number;
  let dayOfWeek: number | undefined;

  if (typeof dateInput === 'object' && !(dateInput instanceof Date)) {
    y = dateInput.year;
    // Handle both 0-indexed and 1-indexed month inputs safely
    m = dateInput.month >= 0 && dateInput.month <= 11 ? dateInput.month + 1 : dateInput.month;
    d = dateInput.day ?? dateInput.dayNumber ?? 1;
    dayOfWeek = dateInput.dayOfWeek;
  } else {
    const parts = parseDateParts(dateInput);
    if (!parts) return fallback;
    y = parts.year;
    m = parts.month;
    d = parts.day;
  }

  if (dayOfWeek === undefined) {
    dayOfWeek = new Date(y, m - 1, d).getDay();
  }

  const dayName = DAY_NAMES_FULL[dayOfWeek] || '';
  const monthName = options?.fullMonth
    ? MONTH_NAMES_FULL[m - 1] || ''
    : MONTH_NAMES_SHORT[m - 1] || '';

  return `${dayName}, ${monthName} ${d}, ${y}`;
}

/**
 * Formats a date for calendar agenda or weekday summaries e.g. "Mon, Nov 16, 2026"
 */
export function formatWeekdayDate(dateInput?: string | Date | null, fallback = ''): string {
  const parts = parseDateParts(dateInput);
  if (!parts) return fallback || (dateInput ? String(dateInput) : '');
  const { year, month, day } = parts;
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  const dayShort = DAY_NAMES_SHORT[dayOfWeek] || '';
  const monthShort = MONTH_NAMES_SHORT[month - 1] || '';
  return `${dayShort}, ${monthShort} ${day}, ${year}`;
}
