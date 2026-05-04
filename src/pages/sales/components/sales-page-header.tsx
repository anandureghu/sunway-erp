import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shared gradient hero for Inventory → Sales workspace pages */
export const SALES_HEADER_CARD_CLASS =
  "border-0 shadow-lg rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 text-white overflow-hidden";

export type SalesPageHeaderProps = {
  /** Pill label above the title */
  titleClassName?: string;
  title: string;
  description?: string;
  /** Back navigation using a router link */
  backHref?: string;
  /** Back navigation using a button (forms, history) */
  /** Optional content below the description (badges, secondary rows) */
  children?: ReactNode;
  /** Primary / secondary actions on the right */
  actions?: ReactNode;
  className?: string;
};

export function SalesPageHeader({
  titleClassName = "",
  title,
  description,
  backHref,
  children,
  actions,
  className,
}: SalesPageHeaderProps) {
  return (
    <Card className={cn(SALES_HEADER_CARD_CLASS, className)}>
      <CardContent className="p-8 sm:p-10 lg:px-12 lg:py-2">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4 flex gap-3">
            {backHref && (
              <Button
                size="sm"
                className="-ml-2 h-9 w-9 rounded-full px-2 bg-white text-black flex items-center justify-center hover:bg-white/90"
                asChild
              >
                <Link to={backHref}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {/* <Badge className="rounded-full border-0 bg-black/25 px-3 py-1 font-normal text-white hover:bg-black/25">
              {badge}
            </Badge> */}
            <div className="space-y-2">
              <h1
                className={cn(
                  "text-2xl font-bold tracking-tight sm:text-4xl",
                  titleClassName,
                )}
              >
                {title}
              </h1>
              {description ? (
                <p className="max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            {children}
          </div>
          {actions ? (
            <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
              {actions}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
