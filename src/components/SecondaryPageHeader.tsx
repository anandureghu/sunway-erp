import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const SECONDARY_PAGE_HEADER_CARD_CLASS =
  "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";

const stripVariants = {
  default: "bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600",
  violet: "bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600",
  emerald: "bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500",
  amber: "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500",
  slate: "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500",
} as const;

const iconVariants = {
  default: "bg-gradient-to-br from-violet-600 to-blue-600",
  violet: "bg-gradient-to-br from-violet-600 to-blue-600",
  emerald: "bg-gradient-to-br from-emerald-600 to-cyan-500",
  amber: "bg-gradient-to-br from-amber-500 to-orange-500",
  slate: "bg-gradient-to-br from-slate-700 to-slate-500",
} as const;

export type SecondaryPageHeaderProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: keyof typeof stripVariants;
};

export function SecondaryPageHeader({
  title,
  description,
  icon,
  actions,
  children,
  className,
  contentClassName,
  variant = "default",
}: SecondaryPageHeaderProps) {
  return (
    <div className={cn(SECONDARY_PAGE_HEADER_CARD_CLASS, className)}>
      <div className={cn("h-1.5 w-full", stripVariants[variant])} />
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-6 py-5",
          contentClassName,
        )}
      >
        <div className="flex items-center gap-4">
          {icon ? (
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
                iconVariants[variant],
              )}
            >
              {icon}
            </div>
          ) : null}
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-900">
              {title}
            </h1>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
            {children}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
