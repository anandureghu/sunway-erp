import {
  Package,
  AlertTriangle,
  ShoppingCart,
  PackageCheck,
} from "lucide-react";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";

type StockStatsCardsProps = {
  totalItems: number;
  lowStockItems: number;
  onOrderCount: number;
  onReserveCount: number;
  activeFilter: string | null;
  onFilter: (key: string) => void;
};

export function StockStatsCards({
  totalItems,
  lowStockItems,
  onOrderCount,
  onReserveCount,
  activeFilter,
  onFilter,
}: StockStatsCardsProps) {
  const hasLow = lowStockItems > 0;

  return (
    <KpiSummaryStrip
      items={[
        kpiFilterItem(
          {
            label: "SKU lines",
            value: totalItems.toLocaleString(),
            hint: "Active catalog items",
            accent: "sky",
            icon: Package,
          },
          "all",
          activeFilter,
          onFilter,
        ),
        kpiFilterItem(
          {
            label: "Low stock",
            value: lowStockItems.toLocaleString(),
            hint: hasLow ? "Needs reorder attention" : "All above reorder level",
            accent: "amber",
            icon: AlertTriangle,
          },
          "low_stock",
          activeFilter,
          onFilter,
        ),
        {
          label: "On Order",
          value: onOrderCount.toLocaleString(),
          hint: "From approved purchase orders",
          accent: "emerald",
          icon: ShoppingCart,
        },
        kpiFilterItem(
          {
            label: "On Reserve",
            value: onReserveCount.toLocaleString(),
            hint: "From confirmed sales orders",
            accent: "violet",
            icon: PackageCheck,
          },
          "on_reserve",
          activeFilter,
          onFilter,
        ),
      ]}
    />
  );
}
