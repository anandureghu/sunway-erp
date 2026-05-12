import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Inventory module header color schemes — one per sub-module */
export const INVENTORY_HEADER_STYLES: Record<string, string> = {
  default:    "from-slate-800 via-slate-700 to-zinc-700",
  stocks:     "from-amber-600 via-orange-600 to-red-600",
  settings:   "from-slate-800 via-blue-800 to-indigo-800",
  reports:    "from-lime-700 via-emerald-600 to-teal-600",
  item:       "from-violet-600 via-indigo-600 to-blue-600",
  warehouse:  "from-cyan-600 via-sky-600 to-blue-600",
  sales:      "from-sky-600 via-blue-600 to-indigo-600",
  purchase:   "from-amber-600 via-orange-600 to-red-600",
};

export type InventoryPageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  variant?: string;
};

export function InventoryPageHeader({
  title,
  description,
  backHref,
  children,
  actions,
  className,
  variant = "default",
}: InventoryPageHeaderProps) {
  const gradient = INVENTORY_HEADER_STYLES[variant] ?? INVENTORY_HEADER_STYLES.default;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl px-6 py-6 shadow-lg bg-gradient-to-r",
        gradient,
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />
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
            {children ?? <Package className="h-6 w-6 text-white" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {description ? (
              <p className="text-xs text-white/80 mt-0.5">{description}</p>
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

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
