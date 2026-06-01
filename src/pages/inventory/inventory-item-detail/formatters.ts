/** Safe number formatting — API may omit or null numeric fields. */
export function safeLocaleQty(
  value: unknown,
  unit: string,
  empty = "—",
): string {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return empty;
  }
  return `${n.toLocaleString()} ${unit}`.trim();
}

export function safeLocaleNumber(value: unknown, empty = "—"): string {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return empty;
  }
  return n.toLocaleString();
}

export function formatInr(value: unknown, empty = "—"): string {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return empty;
  }
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatOptionalDate(value?: string | null, empty = "—"): string {
  if (!value?.trim()) return empty;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return empty;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
