import { Button } from "@/components/ui/button";

interface EmployeeFiltersProps {
  onFilterStatus: (status: string | null) => void;
  activeFilter: string | null;
}

export function EmployeeFilters({ onFilterStatus, activeFilter }: EmployeeFiltersProps) {
  const filters = [
    { label: "All", value: null, color: "bg-blue-500 hover:bg-blue-600 text-white" },
    { label: "Active", value: "active", color: "bg-green-500 hover:bg-green-600 text-white" },
    { label: "Inactive", value: "inactive", color: "bg-red-500 hover:bg-red-600 text-white" },
    { label: "On Leave", value: "on leave", color: "bg-amber-500 hover:bg-amber-600 text-white" }
  ];

  return (
    <div className="flex gap-2 mb-4">
      {filters.map(filter => (
        <Button
          key={filter.label}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterStatus(filter.value)}
          className={`capitalize ${filter.color}`}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}