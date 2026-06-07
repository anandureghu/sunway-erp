import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type GlTabPanelProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: ReactNode;
  toolbarExtra?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  className?: string;
};

export function GlTabPanel({
  title,
  description,
  icon,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actions,
  toolbarExtra,
  children,
  loading = false,
  loadingMessage = "Loading…",
  className,
}: GlTabPanelProps) {
  const showToolbar = searchPlaceholder || actions || toolbarExtra;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm",
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 shadow-sm">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">
                {title}
              </h2>
              {description ? (
                <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showToolbar ? (
        <div className="space-y-3 border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {searchPlaceholder ? (
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={searchPlaceholder}
                  className="rounded-lg border-slate-200 bg-slate-50/50 pl-9 focus-visible:bg-white"
                  value={searchValue}
                  onChange={
                    onSearchChange
                      ? (e) => onSearchChange(e.target.value)
                      : undefined
                  }
                />
              </div>
            ) : (
              <div />
            )}
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {actions}
              </div>
            ) : null}
          </div>
          {toolbarExtra}
        </div>
      ) : null}

      <div className="p-5">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-500">
            {loadingMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
