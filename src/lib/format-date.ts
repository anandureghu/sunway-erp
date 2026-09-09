/**
 * Display dates as DD/MM/YYYY without timezone shift.
 * Accepts API/storage values as yyyy-mm-dd (or ISO datetime prefix).
 */
export function formatDisplayDate(
  v?: string | number | readonly string[] | null,
): string {
  if (v == null || v === "") return "";
  const s = String(v).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return s;
}
