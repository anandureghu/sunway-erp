import type { FinanceDashboardAging } from "@/types/financeDashboard";

export const sumAging = (b: FinanceDashboardAging) =>
  b.current + b.d1To30 + b.d31To60 + b.d61To90 + b.d90Plus;

export const agingSlices = (aging: FinanceDashboardAging) => [
  {
    name: "Current",
    value: aging.current,
    count: aging.currentCount,
    fill: "#22c55e",
  },
  {
    name: "1–30 Days",
    value: aging.d1To30,
    count: aging.d1To30Count,
    fill: "#84cc16",
  },
  {
    name: "31–60 Days",
    value: aging.d31To60,
    count: aging.d31To60Count,
    fill: "#eab308",
  },
  {
    name: "61–90 Days",
    value: aging.d61To90,
    count: aging.d61To90Count,
    fill: "#f97316",
  },
  {
    name: "90+ Days",
    value: aging.d90Plus,
    count: aging.d90PlusCount,
    fill: "#ef4444",
  },
];
