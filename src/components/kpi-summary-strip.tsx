import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

import { SummaryCard, type SummaryCardColor } from "@/modules/hr/components/summary-card";

export type KpiAccent = SummaryCardColor;

export type KpiSummaryStat = {
  label: string;
  value: ReactNode;
  hint: string;
  accent: KpiAccent;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  active?: boolean;
};

export function KpiSummaryStrip({
  items,
  className,
}: {
  items: KpiSummaryStat[];
  className?: string;
}) {
  if (!items.length) return null;

  // Stretch cards across the full row based on count (avoids a short row of 3 on xl).
  const colsByCount =
    items.length === 1
      ? "grid-cols-1"
      : items.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : items.length === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : items.length === 4
            ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

  return (
    <div
      className={cn(
        "grid w-full gap-4",
        colsByCount,
        className,
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <SummaryCard
            key={`${item.label}-${idx}`}
            label={item.label}
            value={item.value}
            description={item.hint}
            color={item.accent}
            icon={<Icon className="size-5" />}
            onClick={item.onClick}
            active={item.active}
          />
        );
      })}
    </div>
  );
}
