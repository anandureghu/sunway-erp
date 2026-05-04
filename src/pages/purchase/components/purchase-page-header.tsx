import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Deep forest green hero strip for Inventory → Purchase workspace */
export const PURCHASE_HEADER_CARD_CLASS =
  "border-0 shadow-lg rounded-2xl bg-gradient-to-br from-zinc-950 via-emerald-950 to-zinc-950 text-white overflow-hidden";

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
    <Card className={cn(PURCHASE_HEADER_CARD_CLASS, className)}>
      <CardContent className="relative p-8 sm:p-10 lg:px-12 lg:py-2">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 45%, white 0%, transparent 52%), radial-gradient(circle at 82% 78%, white 0%, transparent 46%)",
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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
            {/* <Badge className="rounded-full border-0 bg-white/90 px-3 py-1 text-xs font-medium text-slate-900 shadow-sm hover:bg-white/90 sm:text-sm">
              {badge}
            </Badge> */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
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
