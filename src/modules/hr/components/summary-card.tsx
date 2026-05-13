import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SummaryCardColor =
  | "blue"
  | "amber"
  | "emerald"
  | "rose"
  | "violet"
  | "slate";

const COLOR_MAP: Record<SummaryCardColor, { bar: string; iconBg: string }> = {
  blue:    { bar: "from-sky-400 to-blue-500",     iconBg: "bg-blue-50 text-blue-600"     },
  amber:   { bar: "from-amber-400 to-orange-500", iconBg: "bg-amber-50 text-amber-600"   },
  emerald: { bar: "from-emerald-400 to-teal-500", iconBg: "bg-emerald-50 text-emerald-600" },
  rose:    { bar: "from-rose-400 to-pink-500",    iconBg: "bg-rose-50 text-rose-600"     },
  violet:  { bar: "from-violet-400 to-purple-500",iconBg: "bg-violet-50 text-violet-600" },
  slate:   { bar: "from-slate-300 to-slate-400",  iconBg: "bg-slate-50 text-slate-500"   },
};

interface SummaryCardProps {
  label: string;
  value: number | string;
  description?: string;
  icon: ReactNode;
  color?: SummaryCardColor;
}

export function SummaryCard({
  label,
  value,
  description,
  icon,
  color = "blue",
}: SummaryCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className={cn("h-1.5 w-full bg-gradient-to-r", c.bar)} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
              {value}
            </p>
            {description && (
              <p className="mt-1 text-sm text-slate-500 truncate">{description}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              c.iconBg,
            )}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryCard;
