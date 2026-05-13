import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  right?: ReactNode;
  /** Top gradient bar — defaults to violet → purple → blue. */
  barGradient?: string;
  /** Icon box gradient — defaults to violet → blue. */
  iconGradient?: string;
}

export function PageHeader({
  icon,
  title,
  description,
  right,
  barGradient = "from-violet-600 via-purple-500 to-blue-600",
  iconGradient = "from-violet-600 to-blue-600",
}: PageHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className={cn("h-1.5 w-full bg-gradient-to-r", barGradient)} />
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md bg-gradient-to-br text-white",
              iconGradient,
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
