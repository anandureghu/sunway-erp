import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Tailwind classes for status chips. Keys: normalized UPPER_SNAKE, common lowercase, and display strings.
 */
const STATUS_PALETTE: Record<string, string> = {
  // —— Positive / complete ——
  APPROVED: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  approved: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  ACCEPTED: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  POSTED: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  /** Reconciliation / finance confirmation */
  CONFIRMED: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  /** Sales order lifecycle */
  confirmed: "border-transparent bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
  DELIVERED: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  RECEIVED: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  received: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  PAID: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  Paid: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  OPEN: "border-transparent bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100",
  open: "border-transparent bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100",
  ACTIVE: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  active: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  ORDERED: "border-transparent bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
  ordered: "border-transparent bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
  APPLIED: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",

  // —— Negative / terminal ——
  REJECTED: "border-transparent bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
  rejected: "border-transparent bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
  CANCELLED: "border-transparent bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
  cancelled: "border-transparent bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
  CLOSED: "border-transparent bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100",
  closed: "border-transparent bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100",
  REVERSED: "border-transparent bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100",
  UNPAID: "border-transparent bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
  Unpaid: "border-transparent bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
  OVERDUE: "border-transparent bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100",
  Overdue: "border-transparent bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100",

  // —— In progress / warning ——
  PENDING: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  pending: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  SUBMITTED: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  submitted: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  CONVERTED: "border-transparent bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
  converted: "border-transparent bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
  PENDING_APPROVAL: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  DRAFT: "border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  draft: "border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  ON_HOLD: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  HOLD: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  IMPLEMENTED: "border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  PARTIALLY_APPLIED: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  PARTIALLY_PAID: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  "Partially Paid": "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  PARTIALLY_RECEIVED: "border-transparent bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100",
  partially_received: "border-transparent bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100",

  // —— Neutral / info ——
  REVISED: "border-transparent bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100",
  CONFIRMED_ALT: "border-transparent bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
  CONFIRMED_ORDER: "border-transparent bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
  confirmed_so: "border-transparent bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
  PICKED: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  picked: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  DISPATCHED: "border-transparent bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
  dispatched: "border-transparent bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
};

function normalizeKey(s: string): string {
  return s.trim().replace(/\s+/g, "_").toUpperCase();
}

export function getStatusBadgeClass(status: string | null | undefined): string {
  if (status == null || String(status).trim() === "") {
    return "border-transparent bg-muted text-muted-foreground";
  }
  const raw = String(status).trim();
  const keys = [
    raw,
    normalizeKey(raw),
    raw.toLowerCase(),
    raw.toUpperCase(),
  ];
  for (const k of keys) {
    const hit = STATUS_PALETTE[k];
    if (hit) return hit;
  }
  return "border-transparent bg-muted text-muted-foreground";
}

/** Human-readable label for enum-style statuses */
export function formatStatusLabel(status: string): string {
  const s = String(status).trim();
  if (!s) return "—";
  if (s.includes("_")) {
    return s
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ");
  }
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

type StatusBadgeProps = {
  status: string;
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium shadow-none",
        getStatusBadgeClass(status),
        className,
      )}
    >
      {label ?? formatStatusLabel(status)}
    </Badge>
  );
}
