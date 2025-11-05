import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/ui/data-table";
import { EMPLOYEE_COLUMNS } from "@/modules/hr/columns/employees-columns";
import { EMPLOYEES } from "./employees.mock";
import type { Employee } from "@/types/hr";
import { useEmployeeSelection } from "@/context/employee-selection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeFilters } from "@/modules/hr/components/employee-filters";
import { EmployeeStats } from "@/modules/hr/components/employee-stats";

interface EmployeeTableProps {
  data: Employee[];
  onSelect: (employee: Employee) => void;
}

const EmployeeTable = ({ data, onSelect }: EmployeeTableProps) => (
  <DataTable<Employee>
    columns={EMPLOYEE_COLUMNS}
    data={data}
    onRowClick={onSelect}
  />
);

interface EmployeeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const EmployeeSearchBar = ({ value, onChange }: EmployeeSearchBarProps) => (
  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
    <div className="flex gap-2 w-full max-w-md">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by No / Name / Dept / Designation / Status"
        className="h-9 flex-1"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange("")}
        className="h-9 whitespace-nowrap"
      >
        Reset
      </Button>
    </div>
  </div>
);

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setSelected } = useEmployeeSelection();

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    return EMPLOYEES.filter((employee: Employee) => {
      const matchesSearch = !query || 
        employee.employeeNo.toLowerCase().includes(query) ||
        employee.firstName.toLowerCase().includes(query) ||
        employee.lastName.toLowerCase().includes(query) ||
        (employee.department ?? "").toLowerCase().includes(query) ||
        (employee.designation ?? "").toLowerCase().includes(query) ||
        employee.status.toLowerCase().includes(query);

      const matchesStatus = !statusFilter || 
        employee.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelected({
      id: employee.id,
      no: employee.employeeNo,
      name: `${employee.firstName} ${employee.lastName}`,
      firstName: employee.firstName,
      lastName: employee.lastName,
      status: employee.status,
      department: employee.department,
      designation: employee.designation,
      dateOfBirth: employee.dateOfBirth,
      gender: employee.gender,
      joinDate: employee.joinDate,
      nationality: employee.nationality,
      nationalId: employee.nationalId,
      maritalStatus: employee.maritalStatus
    });
    navigate(`/hr/employees/${employee.id}/profile`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Employee Overview</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="default"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              alert('Add Employee flow not implemented in demo');
            }}
          >
            + Add Employee
          </Button>
        </div>
      </div>

      <EmployeeStats employees={EMPLOYEES} />

      <div className="rounded-md border bg-white">
        <div className="p-4">
          <EmployeeSearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
          />
          
          <EmployeeFilters
            onFilterStatus={setStatusFilter}
            activeFilter={statusFilter}
          />
        </div>

        <div className="px-4 pb-4">
          <EmployeeTable 
            data={filteredEmployees}
            onSelect={handleEmployeeSelect}
          />
        </div>
      </div>
    </div>
  );
}
