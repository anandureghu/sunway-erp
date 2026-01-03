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
