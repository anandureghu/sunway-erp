import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SummaryCardColor =
  | "blue"
  | "orange"
  | "emerald"
  | "rose"
  | "violet"
  | "amber"
  | "sky"
  | "slate";

const COLOR_MAP: Record<SummaryCardColor, { bar: string; iconBg: string }> = {
  blue: {
    bar: "border-t-blue-500",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  },
  orange: {
    bar: "border-t-orange-500",
    iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
  },
  emerald: {
    bar: "border-t-emerald-500",
    iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  violet: {
    bar: "border-t-violet-500",
    iconBg: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  },
  rose: {
    bar: "border-t-rose-500",
    iconBg: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
  },
  amber: {
    bar: "border-t-amber-500",
    iconBg: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400",
  },
  sky: {
    bar: "border-t-sky-500",
    iconBg: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  },
  slate: {
    bar: "border-t-slate-500",
    iconBg: "bg-slate-100 text-slate-700 dark:bg-slate-950/50 dark:text-slate-400",
  },
};

interface SummaryCardProps {
  label: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
  color?: SummaryCardColor;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

/**
 * LOCKED UI — KPI / summary card size (match home module cards)
 * Do not enlarge padding or value typography without asking the user first.
 * Compact: p-3.5, gap-3, h-9 icon, text-lg value — same scale as dashboard home tiles.
 */
export function SummaryCard({
  label,
  value,
  description,
  icon,
  color = "blue",
  className,
  onClick,
  active,
}: SummaryCardProps) {
  const c = COLOR_MAP[color];
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      type={onClick ? "button" : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border bg-card p-3.5 text-left shadow-sm transition-all duration-200",
        "border-t-[3px] pt-3",
        onClick && "cursor-pointer hover:shadow-md active:scale-[0.99]",
        active && "ring-2 ring-primary/40 shadow-md",
        c.bar,
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-lg font-bold leading-tight tracking-tight tabular-nums text-slate-900">
          {value}
        </p>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {icon && (
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            c.iconBg,
          )}
          aria-hidden
        >
          {icon}
        </div>
      )}
    </Comp>
  );
}

export default SummaryCard;
