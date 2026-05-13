import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Orange / amber gradient — distinct from HR violet-blue and Sales violet-indigo */
export const INV_PURCHASE_HEADER_CLASS =
  "relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-6 py-6 shadow-lg";

export type InventoryPurchaseHeaderProps = {
  title?: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function InventoryPurchaseHeader({
  title,
  description,
  backHref,
  actions,
  className,
}: InventoryPurchaseHeaderProps) {
  return (
    <div className={cn(INV_PURCHASE_HEADER_CLASS, className)}>
      {/* Blur orbs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-amber-300/20 blur-2xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          {backHref ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white rounded-lg"
              asChild
            >
              <Link to={backHref} aria-label="Go back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>

          {title ? (
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              {description ? (
                <p className="text-xs text-amber-100 mt-0.5">{description}</p>
              ) : null}
            </div>
          ) : null}
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

export default function InventoryPurchasePage() {
  return (
    <div className="space-y-6 p-6 min-h-screen bg-slate-50/60">
      <InventoryPurchaseHeader
        title="Inventory - Purchase"
        description="Manage purchase-related inventory tracking and reporting"
        backHref="/dashboard"
      />
    </div>
  );
}
