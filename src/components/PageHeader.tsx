import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Deep forest green hero strip for Inventory → Purchase workspace */
export const PAGE_HEADER_CARD_CLASS =
  "border-0 shadow-lg rounded-2xl text-white overflow-hidden mb-4";

const variants = {
  default: "bg-gradient-to-br from-primary via-blue-600 to-primary",
  darkGreen: "bg-gradient-to-br from-zinc-950 via-emerald-950 to-zinc-950",
  lightGreen:
    "bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-700",
  red: "bg-gradient-to-br from-red-700 via-red-600 to-red-700",
  yellow: "bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-600",
  darkBlue: "bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900",
  green: "bg-gradient-to-br from-secondary-gradient to-secondary-gradient",
} as const;

/** Use on links/buttons placed in PageHeader `actions` (dark hero inherits white text). */
export const PAGE_HEADER_ACTION_LINK_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-md border border-white/40 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-100 [&_svg]:shrink-0 [&_svg]:stroke-slate-900 [&_svg]:text-slate-900";

export type PageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  variant?: keyof typeof variants;
  icon?: ReactNode;
};

export function PageHeader({
  title,
  description,
  backHref,
  children,
  actions,
  className,
  variant = "default",
  icon,
}: PageHeaderProps) {
  return (
    <Card className={cn(PAGE_HEADER_CARD_CLASS, variants[variant], className)}>
      <CardContent className="relative py-0 px-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4 flex gap-3">
            {backHref && (
              <Link
                to={backHref}
                aria-label="Go back"
                className={cn(
                  "-ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  "border border-white/40 bg-white shadow-md",
                  "text-slate-900 hover:bg-slate-100 transition-colors",
                  "[&_svg]:stroke-slate-900 [&_svg]:text-slate-900",
                )}
              >
                <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
              </Link>
            )}
            {/* <Badge className="rounded-full border-0 bg-white/90 px-3 py-1 text-xs font-medium text-slate-900 shadow-sm hover:bg-white/90 sm:text-sm">
              {badge}
            </Badge> */}
            <div className="flex items-center gap-2">
              {icon && (
                <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
                  {icon}
                </div>
              )}
              <div className="space-y-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-2xl">
                  {title}
                </h1>
                {description ? (
                  <p className="max-w-2xl text-sm leading-relaxed text-white/80">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>

            {children}
          </div>
          {actions ? (
            <div
              className={cn(
                "flex flex-shrink-0 flex-wrap items-center gap-3",
                "[&_button]:border-white/40 [&_button]:bg-white [&_button]:text-slate-900",
                "[&_button]:shadow-sm [&_button]:hover:bg-slate-100",
                "[&_a]:inline-flex [&_a]:items-center [&_a]:gap-2 [&_a]:rounded-md",
                "[&_a]:border [&_a]:border-white/40 [&_a]:bg-white [&_a]:px-3 [&_a]:py-1.5",
                "[&_a]:text-sm [&_a]:font-medium [&_a]:text-slate-900 [&_a]:shadow-sm",
                "[&_a]:hover:bg-slate-100",
                "[&_svg]:stroke-slate-900 [&_svg]:text-slate-900",
              )}
            >
              {actions}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
