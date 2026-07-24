import type { FinanceDashboardAging } from "@/types/financeDashboard";

export const monthLabel = (yearMonth: string) => {
  const [y, m] = yearMonth.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
};

export const compactNumber = (n: number) => {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
};

export const sumAging = (b: FinanceDashboardAging) =>
  b.current + b.d1To30 + b.d31To60 + b.d61To90 + b.d90Plus;

export const agingSlices = (aging: FinanceDashboardAging) => [
  { name: "Current", amount: aging.current, count: aging.currentCount, fill: "#22c55e" },
  { name: "1–30 Days", amount: aging.d1To30, count: aging.d1To30Count, fill: "#84cc16" },
  { name: "31–60 Days", amount: aging.d31To60, count: aging.d31To60Count, fill: "#eab308" },
  { name: "61–90 Days", amount: aging.d61To90, count: aging.d61To90Count, fill: "#f97316" },
  { name: "90+ Days", amount: aging.d90Plus, count: aging.d90PlusCount, fill: "#ef4444" },
];

export const formatShortDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatTime = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};
