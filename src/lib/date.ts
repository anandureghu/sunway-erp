export function toInputDate(iso?: string): string {
  // Keep UI using HTML date input format YYYY-MM-DD
  if (!iso) return "";
  // If already in YYYY-MM-DD, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  // If incoming is DD-MM-YYYY, convert
  const parts = iso.split("-").map((p) => p.trim());
  if (parts.length === 3) {
    const [a, b, c] = parts;
    // detect dd-mm-yyyy
    if (a.length === 2 && b.length === 2 && c.length === 4) {
      return `${c.padStart(4, "0")}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
    }
  }
  return "";
}

export function toIsoDate(input?: string): string | undefined {
  if (!input) return undefined;
  input = input.trim();
  // If already ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  // If input is DD-MM-YYYY convert to ISO
  const parts = input.split("-").map((p) => p.trim());
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return undefined;
}

/**
 * Parse a date-only string ("YYYY-MM-DD", optionally followed by a time part)
 * into a Date at LOCAL midnight.
 *
 * `new Date("2026-07-01")` parses as UTC midnight, which renders/compares as the
 * previous calendar day in negative-UTC timezones and can shift day-of-week and
 * day-count math. This builds the Date from the local Y/M/D parts instead.
 * Returns null for empty or unparseable input.
 */
export function parseLocalDate(value?: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match) {
    const [, y, m, d] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(date.getTime()) ? null : date;
  }
  // Fall back to the native parser for other formats (e.g. full ISO datetimes).
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  
  const newDate = new Date(year, month - 1 + months, day);
  const newYear = newDate.getFullYear();
  const newMonth = newDate.getMonth() + 1;
  const newDay = newDate.getDate();
  
  return `${newYear}-${newMonth.toString().padStart(2, '0')}-${newDay.toString().padStart(2, '0')}`;
}
