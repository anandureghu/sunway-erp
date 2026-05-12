import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Inventory purchase workspace header. */
export const PURCHASE_HEADER_CARD_CLASS =
  "relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 px-6 py-6 shadow-lg";

export type PurchasePageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PurchasePageHeader({
  title,
  description,
  backHref,
  children,
  actions,
  className,
}: PurchasePageHeaderProps) {
  return (
    <div className={cn(PURCHASE_HEADER_CARD_CLASS, className)}>
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-amber-300/20 blur-2xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          {backHref ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg text-white hover:bg-white/20 hover:text-white"
              asChild
            >
              <Link to={backHref} aria-label="Go back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner">
            {children ?? <ClipboardList className="h-6 w-6 text-white" />}
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {description ? (
              <p className="mt-0.5 text-xs text-white/80">{description}</p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
