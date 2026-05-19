import {
  Package,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";

type StockStatsCardsProps = {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  warehouseCount: number;
};

export function StockStatsCards({
  totalItems,
  lowStockItems,
  totalValue,
  warehouseCount,
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
          label: "Inventory value",
          value: formatMoney(totalValue),
          hint: "Available × cost",
          accent: "emerald",
          icon: TrendingUp,
        },
        {
          label: "Warehouses",
          value: warehouseCount.toLocaleString(),
          hint: "Storage locations",
          accent: "violet",
          icon: WarehouseIcon,
        },
      ]}
    />
  );
}
