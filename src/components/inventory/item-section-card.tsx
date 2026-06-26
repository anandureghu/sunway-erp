import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ItemSectionCard({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
            {icon}
          </div>
          <span className="text-[13px] font-semibold text-slate-700">{title}</span>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </div>
  );
}

export function ItemDetailField({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  const empty =
    value === null ||
    value === undefined ||
    value === "" ||
    value === "—";

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div
        className={cn(
          "text-[13px] leading-relaxed text-slate-800",
          mono && "font-mono text-xs",
          empty && "text-slate-400",
        )}
      >
        {empty ? "—" : value}
      </div>
    </div>
  );
}
