import { cn } from "@/lib/utils";

interface EmployeeFiltersProps {
  onFilterStatus: (status: string | null) => void;
  activeFilter: string | null;
}

const filters = [
  { label: "All",      value: null,       dot: "bg-blue-500" },
  { label: "Active",   value: "active",   dot: "bg-emerald-500" },
  { label: "On Leave", value: "on leave", dot: "bg-amber-500" },
  { label: "Inactive", value: "inactive", dot: "bg-rose-500" },
] as const;

export function EmployeeFilters({
  onFilterStatus,
  activeFilter,
}: EmployeeFiltersProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map((f) => {
        const isActive = activeFilter === f.value;
        return (
          <button
            key={f.label}
            type="button"
            onClick={() => onFilterStatus(f.value)}
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
