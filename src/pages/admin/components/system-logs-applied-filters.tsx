import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SystemLogFilters } from "./system-logs-filter-dialog";

type AppliedFilterChip = {
  id: string;
  label: string;
};

function formatFilterDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

function buildChips(
  filters: SystemLogFilters,
  search: string,
): AppliedFilterChip[] {
  const chips: AppliedFilterChip[] = [];

  if (search) {
    chips.push({ id: "search", label: `Search: ${search}` });
  }
  if (filters.level !== "all") {
    chips.push({
      id: "level",
      label: `Level: ${filters.level === "WARN" ? "Warning" : filters.level}`,
    });
  }
  if (filters.module !== "All") {
    chips.push({ id: "module", label: `Module: ${filters.module}` });
  }
  const userId = filters.userIdFilter.trim();
  if (userId && /^\d+$/.test(userId)) {
    chips.push({ id: "userId", label: `User ID: ${userId}` });
  }
  if (filters.fromDate) {
    chips.push({
      id: "fromDate",
      label: `From: ${formatFilterDate(filters.fromDate)}`,
    });
  }
  if (filters.toDate) {
    chips.push({
      id: "toDate",
      label: `To: ${formatFilterDate(filters.toDate)}`,
    });
  }

  return chips;
}

type SystemLogsAppliedFiltersProps = {
  filters: SystemLogFilters;
  search: string;
  onClearSearch: () => void;
  onUpdateFilters: (filters: SystemLogFilters) => void;
  onClearAll: () => void;
};

export function SystemLogsAppliedFilters({
  filters,
  search,
  onClearSearch,
  onUpdateFilters,
  onClearAll,
}: SystemLogsAppliedFiltersProps) {
  const chips = buildChips(filters, search);

  if (chips.length === 0) {
    return null;
  }

  const removeChip = (id: string) => {
    switch (id) {
      case "search":
        onClearSearch();
        break;
      case "level":
        onUpdateFilters({ ...filters, level: "all" });
        break;
      case "module":
        onUpdateFilters({ ...filters, module: "All" });
        break;
      case "userId":
        onUpdateFilters({ ...filters, userIdFilter: "" });
        break;
      case "fromDate":
        onUpdateFilters({ ...filters, fromDate: "" });
        break;
      case "toDate":
        onUpdateFilters({ ...filters, toDate: "" });
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Applied:</span>
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant="outline"
          className="gap-1 border-slate-200 bg-slate-100 pr-1 font-normal text-slate-800"
        >
          {chip.label}
          <button
            type="button"
            className="ml-0.5 rounded-full p-0.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            aria-label={`Remove ${chip.label}`}
            onClick={() => removeChip(chip.id)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          className="text-xs text-blue-600 hover:underline"
          onClick={onClearAll}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
