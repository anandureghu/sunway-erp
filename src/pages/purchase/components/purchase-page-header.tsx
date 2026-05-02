import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Deep forest green hero strip for Inventory → Purchase workspace */
export const PURCHASE_HEADER_CARD_CLASS =
  "border-0 shadow-lg rounded-2xl bg-gradient-to-br from-zinc-950 via-emerald-950 to-zinc-950 text-white overflow-hidden";

export type PurchasePageHeaderProps = {
  badge?: string;
  title: string;
  description?: string;
  backHref?: string;
  onBack?: () => void;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PurchasePageHeader({
  badge = "Inventory • Purchase hub",
  title,
  description,
  backHref,
  onBack,
  children,
  actions,
  className,
}: PurchasePageHeaderProps) {
  return (
    <Card className={cn(PURCHASE_HEADER_CARD_CLASS, className)}>
      <CardContent className="relative p-8 sm:p-10 lg:px-12 lg:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 45%, white 0%, transparent 52%), radial-gradient(circle at 82% 78%, white 0%, transparent 46%)",
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            {(backHref || onBack) && (
              <div>
                {backHref ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-9 px-2 text-white hover:bg-white/10"
                    asChild
                  >
                    <Link to={backHref}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-9 px-2 text-white hover:bg-white/10"
                    onClick={onBack}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
              </div>
            )}
            <Badge className="rounded-full border-0 bg-white/90 px-3 py-1 text-xs font-medium text-slate-900 shadow-sm hover:bg-white/90 sm:text-sm">
              {badge}
            </Badge>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{title}</h1>
              {description ? (
                <p className="max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            {children}
          </div>
          {actions ? (
            <div className="flex flex-shrink-0 flex-wrap items-center gap-3">{actions}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
