/** Records marked archived must not appear in operational KPI totals. */
export function notArchived<T extends { archived?: boolean | null }>(
  row: T,
): boolean {
  return !row.archived;
}

export function excludeArchived<T extends { archived?: boolean | null }>(
  rows: readonly T[],
): T[] {
  return rows.filter(notArchived);
}
