/**
 * Attendance punch times are stored as company wall-clock LocalDateTime (no zone in JSON).
 * Clock times display in 12-hour format; durations use 24-hour HH:MM:SS.
 * Default company timezone is Asia/Qatar.
 */

export const DEFAULT_COMPANY_TIMEZONE = "Asia/Qatar";

export function resolveCompanyTimezone(timezone?: string | null): string {
  const tz = timezone?.trim();
  if (!tz) return DEFAULT_COMPANY_TIMEZONE;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_COMPANY_TIMEZONE;
  }
}

/** @deprecated Prefer resolveCompanyTimezone / DEFAULT_COMPANY_TIMEZONE */
export const QATAR_TZ = DEFAULT_COMPANY_TIMEZONE;

/**
 * Interpret a zone-less LocalDateTime string as wall clock in `timeZone`.
 */
export function parseTimesheetDateTime(
  value: string | null | undefined,
  timeZone: string = DEFAULT_COMPANY_TIMEZONE,
): Date | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw)) {
    const dated = new Date(raw);
    return Number.isNaN(dated.getTime()) ? null : dated;
  }

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?/,
  );
  if (!match) {
    const dated = new Date(raw);
    return Number.isNaN(dated.getTime()) ? null : dated;
  }

  const [, y, mo, d, h, mi, s = "0"] = match;
  const tz = resolveCompanyTimezone(timeZone);
  const utcGuess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);

  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const asZoneMs = (instant: number) => {
    const parts = Object.fromEntries(
      dtf
        .formatToParts(new Date(instant))
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value]),
    ) as Record<string, string>;
    return Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      +parts.hour,
      +parts.minute,
      +parts.second,
    );
  };

  // Refine once: difference between intended wall clock and what the zone shows for utcGuess.
  const offset = asZoneMs(utcGuess) - utcGuess;
  const refined = new Date(utcGuess - offset);
  return Number.isNaN(refined.getTime()) ? null : refined;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Live clock in 12-hour format for a timezone. */
export function formatLiveClock(
  d: Date = new Date(),
  timeZone: string = DEFAULT_COMPANY_TIMEZONE,
): string {
  return d.toLocaleTimeString("en-US", {
    timeZone: resolveCompanyTimezone(timeZone),
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/** Punch time (check-in / check-out) in 12-hour format. */
export function formatPunchTime(
  iso: string | null | undefined,
  timeZone: string = DEFAULT_COMPANY_TIMEZONE,
): string {
  const tz = resolveCompanyTimezone(timeZone);
  const d = parseTimesheetDateTime(iso, tz);
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Same punch instant as company wall-clock, displayed in another timezone
 * (e.g. the employee's browser local). Returns null when zones match or
 * the punch is missing.
 */
export function formatPunchTimeInZone(
  iso: string | null | undefined,
  storedAsTimeZone: string,
  displayTimeZone: string,
): string | null {
  if (!iso) return null;
  const stored = resolveCompanyTimezone(storedAsTimeZone);
  const display = resolveCompanyTimezone(displayTimeZone);
  if (stored === display) return null;
  const d = parseTimesheetDateTime(iso, stored);
  if (!d) return null;
  return d.toLocaleTimeString("en-US", {
    timeZone: display,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Short label for an IANA zone, e.g. "Qatar" / "India Standard Time". */
export function formatTimezoneLabel(timeZone: string): string {
  const tz = resolveCompanyTimezone(timeZone);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "long",
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    if (name) return name;
  } catch {
    // fall through
  }
  return tz;
}

/** Compact city/region from IANA id when long name is too long. */
export function formatTimezoneShort(timeZone: string): string {
  const tz = resolveCompanyTimezone(timeZone);
  const leaf = tz.split("/").pop()?.replaceAll("_", " ");
  return leaf || tz;
}

export function hourInTimezone(
  d: Date = new Date(),
  timeZone: string = DEFAULT_COMPANY_TIMEZONE,
): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: resolveCompanyTimezone(timeZone),
      hour: "2-digit",
      hour12: false,
    }).format(d),
  );
}

/** @deprecated use hourInTimezone */
export function qatarHour(d: Date = new Date()): number {
  return hourInTimezone(d, DEFAULT_COMPANY_TIMEZONE);
}

export function diffMs(
  from: string | null | undefined,
  to?: string | null,
  timeZone: string = DEFAULT_COMPANY_TIMEZONE,
): number {
  const tz = resolveCompanyTimezone(timeZone);
  const start = parseTimesheetDateTime(from, tz);
  if (!start) return 0;
  const end = to ? parseTimesheetDateTime(to, tz) : new Date();
  if (!end) return 0;
  return Math.max(0, end.getTime() - start.getTime());
}

export function msToDuration(ms: number): { h: number; m: number; s: number } {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Compact label e.g. "2h 15m" / "45m". */
export function formatDurationCompact(ms: number): string {
  const { h, m } = msToDuration(ms);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** 24-hour style duration HH:MM:SS. */
export function formatDuration24(ms: number): string {
  const { h, m, s } = msToDuration(ms);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Common IANA options for HR Policies. */
export const COMPANY_TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "Asia/Qatar", label: "Asia/Qatar (Qatar)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (UAE)" },
  { value: "Asia/Riyadh", label: "Asia/Riyadh (Saudi Arabia)" },
  { value: "Asia/Kuwait", label: "Asia/Kuwait" },
  { value: "Asia/Bahrain", label: "Asia/Bahrain" },
  { value: "Asia/Muscat", label: "Asia/Muscat (Oman)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (India)" },
  { value: "Asia/Karachi", label: "Asia/Karachi (Pakistan)" },
  { value: "Asia/Dhaka", label: "Asia/Dhaka (Bangladesh)" },
  { value: "Asia/Manila", label: "Asia/Manila (Philippines)" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Europe/London", label: "Europe/London (UK)" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Africa/Cairo", label: "Africa/Cairo (Egypt)" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi" },
  { value: "America/New_York", label: "America/New_York (US Eastern)" },
  { value: "UTC", label: "UTC" },
];
