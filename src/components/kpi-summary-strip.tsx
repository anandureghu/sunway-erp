import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ACCENT = {
  blue: {
    bar: "border-t-blue-500",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  },
  orange: {
    bar: "border-t-orange-500",
    icon: "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
  },
  emerald: {
    bar: "border-t-emerald-500",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  violet: {
    bar: "border-t-violet-500",
    icon: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  },
  rose: {
    bar: "border-t-rose-500",
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
  },
  amber: {
    bar: "border-t-amber-500",
    icon: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400",
  },
  sky: {
    bar: "border-t-sky-500",
    icon: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  },
} as const;

export type KpiAccent = keyof typeof ACCENT;

export type KpiSummaryStat = {
  label: string;
  value: ReactNode;
  hint: string;
  accent: KpiAccent;
  icon: React.ComponentType<{ className?: string }>;
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
        const tone = ACCENT[item.accent];
        return (
          <div
            key={`${item.label}-${idx}`}
            className={cn(
              "flex items-center gap-4 rounded-xl border bg-card px-5 py-5 shadow-sm",
              "border-t-4 pt-4",
              tone.bar,
            )}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="text-2xl font-bold tracking-tight tabular-nums">
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">{item.hint}</p>
            </div>
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                tone.icon,
              )}
              aria-hidden
            >
              <Icon className="size-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
