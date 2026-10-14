import type { ReactNode, SelectHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Canonical list toolbar row — search → select → chips (Employee Register). */
export function ListToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-5 py-4 lg:flex-row lg:flex-wrap lg:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

const searchInputClass =
  "h-9 rounded-full border-slate-200 pl-9 pr-9 text-sm focus-visible:ring-slate-200";

/** Pill search with leading icon and optional clear. */
export function ListSearchField({
  value,
  onChange,
  placeholder = "Search…",
  className,
  inputClassName,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
}) {
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={cn(searchInputClass, inputClassName)}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

const selectClass =
  "h-9 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200";

/** Native select matching the register department filter. */
export function ListToolbarSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(selectClass, className)} {...props}>
      {children}
    </select>
  );
}

export type FilterChipOption<T extends string | null = string | null> = {
  label: string;
  value: T;
  count?: number;
};

/**
 * Status / category chips — active = solid slate-900; idle = white + border.
 * Matches Employee Register filter chips.
 */
export function FilterChipGroup<T extends string | null = string | null>({
  options,
  value,
  onChange,
  className,
  equal = (a, b) => a === b,
}: {
  options: readonly FilterChipOption<T>[] | FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  equal?: (a: T, b: T) => boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {options.map((opt) => {
        const isActive = equal(value, opt.value);
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
              isActive
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {opt.label}
            {opt.count != null && (
              <span
                className={cn(
                  "tabular-nums",
                  isActive ? "text-white/80" : "text-slate-400",
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
