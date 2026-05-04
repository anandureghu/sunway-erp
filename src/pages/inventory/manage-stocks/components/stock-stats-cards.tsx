import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Package,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatMoney } from "@/lib/utils";

type StockStatsCardsProps = {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  warehouseCount: number;
};

function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  topBarClass,
  iconWrapperClass,
  valueClassName,
  cardClassName,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  topBarClass: string;
  iconWrapperClass: string;
  valueClassName?: string;
  cardClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:border-border hover:shadow-md",
        cardClassName,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r opacity-90",
          topBarClass,
        )}
        aria-hidden
      />
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums tracking-tight sm:text-3xl",
                valueClassName,
              )}
            >
              {value}
            </p>
            {sublabel ? (
              <p className="text-xs text-muted-foreground">{sublabel}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-border/60 transition-transform duration-200 group-hover:scale-105",
              iconWrapperClass,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StockStatsCards({
  totalItems,
  lowStockItems,
  totalValue,
  warehouseCount,
}: StockStatsCardsProps) {
  const hasLow = lowStockItems > 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="SKU lines"
        value={totalItems.toLocaleString()}
        sublabel="Active catalog items"
        icon={Package}
        topBarClass="from-blue-500 to-cyan-500"
        iconWrapperClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <KpiCard
        label="Low stock"
        value={lowStockItems.toLocaleString()}
        sublabel={
          hasLow ? "Needs reorder attention" : "All above reorder level"
        }
        icon={AlertTriangle}
        topBarClass="from-amber-500 to-orange-500"
        iconWrapperClass={cn(
          "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          hasLow && "ring-amber-500/25",
        )}
        valueClassName={
          hasLow ? "text-amber-700 dark:text-amber-400" : undefined
        }
        cardClassName={
          hasLow
            ? "border-amber-500/25 bg-amber-500/[0.03] dark:bg-amber-500/[0.06]"
            : undefined
        }
      />
      <KpiCard
        label="Inventory value"
        value={formatMoney(totalValue)}
        sublabel="Available × cost"
        icon={TrendingUp}
        topBarClass="from-emerald-500 to-teal-500"
        iconWrapperClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <KpiCard
        label="Warehouses"
        value={warehouseCount.toLocaleString()}
        sublabel="Storage locations"
        icon={WarehouseIcon}
        topBarClass="from-violet-500 to-fuchsia-500"
        iconWrapperClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
      />
    </div>
  );
}
