import {
  Package,
  AlertTriangle,
  ShoppingCart,
  PackageCheck,
} from "lucide-react";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";

type StockStatsCardsProps = {
  totalItems: number;
  lowStockItems: number;
  onOrderCount: number;
  onReserveCount: number;
};

export function StockStatsCards({
  totalItems,
  lowStockItems,
  onOrderCount,
  onReserveCount,
}: StockStatsCardsProps) {
  const hasLow = lowStockItems > 0;

  return (
    <KpiSummaryStrip
      items={[
        {
          label: "SKU lines",
          value: totalItems.toLocaleString(),
          hint: "Active catalog items",
          accent: "sky",
          icon: Package,
        },
        {
          label: "Low stock",
          value: lowStockItems.toLocaleString(),
          hint: hasLow ? "Needs reorder attention" : "All above reorder level",
          accent: "amber",
          icon: AlertTriangle,
        },
        {
          label: "On Order",
          value: onOrderCount.toLocaleString(),
          hint: "From approved purchase orders",
          accent: "emerald",
          icon: ShoppingCart,
        },
        {
          label: "On Reserve",
          value: onReserveCount.toLocaleString(),
          hint: "From confirmed sales orders",
          accent: "violet",
          icon: PackageCheck,
        },
      ]}
    />
  );
}
