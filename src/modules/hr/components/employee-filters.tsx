import { cn } from "@/lib/utils";

/**
 * LOCKED UI — Employee Register status chips
 * Do not restyle, rename, or reorder these chips without asking the user first.
 * Reference: compact register toolbar (All / Active / Probation / On leave / Exiting / Inactive).
 * Active chip = solid slate-900 + white text; idle = white + border.
 */
interface EmployeeFiltersProps {
  onFilterStatus: (status: string | null) => void;
  activeFilter: string | null;
}

const filters = [
  { label: "All", value: null },
  { label: "Active", value: "ACTIVE" },
  { label: "Probation", value: "UNDER_PROBATION" },
  { label: "On leave", value: "ON_LEAVE" },
  { label: "Exiting", value: "RESIGNED" },
  { label: "Inactive", value: "INACTIVE" },
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
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.map((f) => {
        const valueKey = toStatusKey(f.value);
        const isActive = activeKey === valueKey;
        return (
          <button
            key={f.label}
            type="button"
            onClick={() => onFilterStatus(valueKey)}
            className={cn(
              "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
              isActive
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
