import type { ReactNode } from "react";
import { parseISO } from "date-fns";
import type { ChartConfig } from "@/components/ui/chart";
import type { SalesOrder } from "@/types/sales";

export const PIE_COLORS = [
  "hsl(220 83% 56%)",
  "hsl(142 76% 45%)",
  "hsl(38 92% 56%)",
  "hsl(280 70% 60%)",
  "hsl(0 78% 60%)",
  "hsl(190 80% 50%)",
];

export const VALUATION_COLOR = "hsl(142 76% 45%)";
export const COGS_COLOR = "hsl(38 92% 56%)";

export const batchTrendChartConfig = {
  receiveQty: { label: "Received", color: "hsl(142 76% 45%)" },
  issueQty: { label: "Issued", color: "hsl(0 78% 60%)" },
} satisfies ChartConfig;

export const compactNumber = (n: number) => {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
};

export function inDateRange(isoDate: string, from: string, to: string): boolean {
  try {
    const d = parseISO(isoDate);
    const a = parseISO(from);
    const b = parseISO(to);
    return d >= a && d <= b;
  } catch {
    return false;
  }
}

export function orderCountsForTurnover(o: SalesOrder): boolean {
  const s = (o.status || "").toLowerCase();
  if (s === "cancelled" || s === "draft") return false;
  if (o.archived) return false;
  return true;
}

export function QuickChip({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
          : "rounded-xl border bg-muted/40 p-4"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
