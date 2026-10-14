import { FilterChipGroup } from "@/components/list-toolbar";

/**
 * LOCKED UI — Employee Register status chips
 * Do not restyle, rename, or reorder these chips without asking the user first.
 * Reference: compact register toolbar (All / Active / Probation / On leave / Exiting / Inactive).
 * Active chip = solid slate-900 + white text; idle = white + border.
 * Styling lives in FilterChipGroup (shared list-toolbar standard).
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
    <FilterChipGroup
      options={filters.map((f) => ({
        label: f.label,
        value: toStatusKey(f.value),
      }))}
      value={activeKey}
      onChange={onFilterStatus}
    />
  );
}
