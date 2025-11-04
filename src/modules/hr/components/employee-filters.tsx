import { Button } from "@/components/ui/button";

interface EmployeeFiltersProps {
  onFilterStatus: (status: string | null) => void;
  activeFilter: string | null;
}

export function EmployeeFilters({ onFilterStatus, activeFilter }: EmployeeFiltersProps) {
  const filters = [
    { label: "All", value: null },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "On Leave", value: "on leave" }
  ];

  return (
    <div className="flex gap-2 mb-4">
      {filters.map(filter => (
        <Button
          key={filter.label}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterStatus(filter.value)}
          className="capitalize"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}