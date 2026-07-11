import { format } from "date-fns";

/** Builds a CSV file from `rows` (first row is the header) and triggers a browser download. */
export function downloadCsv(rows: string[][], filenamePrefix: string) {
  const csv = rows
    .map((r) => r.map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
