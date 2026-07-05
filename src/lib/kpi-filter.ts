import type { KpiSummaryStat } from "@/components/kpi-summary-strip";

export function kpiFilterItem(
  item: Omit<KpiSummaryStat, "onClick" | "active">,
  key: string,
  activeFilter: string | null,
  onSelect: (key: string) => void,
): KpiSummaryStat {
  return {
    ...item,
    onClick: () => onSelect(key),
    active: activeFilter === key,
  };
}
