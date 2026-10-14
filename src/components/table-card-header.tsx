import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared header for list/table cards — matches Employee Register:
 * uppercase muted title left, optional count/meta right, bottom divider.
 */
export function TableCardHeader({
  title,
  meta,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-slate-100 px-5 py-3",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      {meta != null && (
        <span className="ml-auto text-[11px] font-normal normal-case tracking-normal text-slate-400 tabular-nums">
          {meta}
        </span>
      )}
    </div>
  );
}
