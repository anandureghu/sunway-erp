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

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
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
