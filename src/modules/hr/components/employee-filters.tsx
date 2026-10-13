import { cn } from "@/lib/utils";

interface EmployeeFiltersProps {
  onFilterStatus: (status: string | null) => void;
  activeFilter: string | null;
}

const filters = [
  { label: "All",             value: null,              dot: "bg-blue-500" },
  { label: "Active",          value: "ACTIVE",          dot: "bg-emerald-500" },
  { label: "Under Probation", value: "UNDER_PROBATION", dot: "bg-indigo-500" },
  { label: "On Leave",        value: "ON_LEAVE",        dot: "bg-amber-500" },
  { label: "Resigned",        value: "RESIGNED",        dot: "bg-orange-500" },
  { label: "Terminated",      value: "TERMINATED",      dot: "bg-rose-500" },
  { label: "Retired",         value: "RETIRED",         dot: "bg-violet-500" },
  { label: "Inactive",        value: "INACTIVE",        dot: "bg-slate-500" },
] as const;

const toStatusKey = (raw: string | null | undefined) =>
  raw == null || raw === ""
    ? null
    : raw
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

export function EmployeeFilters({
  onFilterStatus,
  activeFilter,
}: EmployeeFiltersProps) {
  const activeKey = toStatusKey(activeFilter);
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map((f) => {
        const valueKey = toStatusKey(f.value);
        const isActive = activeKey === valueKey;
        return (
          <button
            key={f.label}
            type="button"
            onClick={() => onFilterStatus(valueKey)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
              isActive
                ? "border-foreground/20 bg-foreground text-background shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted hover:text-foreground",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", f.dot)} />
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
