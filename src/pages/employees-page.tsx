import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/ui/data-table";
import { EMPLOYEE_COLUMNS } from "@/modules/hr/columns/employees-columns";
import { hrService } from "@/service/hr.service";
import { addressService } from "@/service/addressService";
import type { Employee } from "@/types/hr";
import { useEmployeeSelection } from "@/context/employee-selection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeFilters } from "@/modules/hr/components/employee-filters";
import { EmployeeStats } from "@/modules/hr/components/employee-stats";
import { AddEmployeeModal } from "@/context/employee-selection";

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

interface EmployeeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  showAdd?: boolean;
  onAddClick?: () => void;
}

const EmployeeSearchBar = ({
  value,
  onChange,
  showAdd,
  onAddClick,
}: EmployeeSearchBarProps) => (
  <div className="flex items-center justify-between gap-3 p-4">
    <div className="flex gap-2 w-full max-w-md items-center">
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

    {showAdd && (
      <div className="flex-shrink-0">
        <Button
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 h-9"
          onClick={onAddClick}
        >
          + Add Employee
        </Button>
      </div>
    )}
  </div>
);

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const navigate = useNavigate();
  const { setSelected } = useEmployeeSelection();

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const normalize = (s?: string | null) =>
      String(s ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");

    const desired = normalize(statusFilter);

    return employees.filter((employee: Employee) => {
      const empNo = String(employee.employeeNo ?? "").toLowerCase();
      const first = String(employee.firstName ?? "").toLowerCase();
      const last = String(employee.lastName ?? "").toLowerCase();
      const dept = String(employee.department ?? "").toLowerCase();
      const desig = String(employee.designation ?? "").toLowerCase();
      const stat = String(employee.status ?? "").toLowerCase();

      const matchesSearch =
        !query ||
        empNo.includes(query) ||
        first.includes(query) ||
        last.includes(query) ||
        dept.includes(query) ||
        desig.includes(query) ||
        stat.includes(query);

      const matchesStatus = !statusFilter || normalize(employee.status) === desired;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, employees]);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelected({
      id: employee.id?.toString() || "",
      no: employee.employeeNo?.toString() || "",
      name: `${employee.firstName} ${employee.lastName}`,
      firstName: employee.firstName?.toString() || "",
      lastName: employee.lastName?.toString() || "",
      status: employee.status?.toString() || "",
      department: employee.department,
      designation: employee.designation,
      dateOfBirth: employee.dateOfBirth,
      gender: employee.gender,
      joinDate: employee.joinDate,
      nationality: employee.nationality,
      nationalId: employee.nationalId,
      maritalStatus: employee.maritalStatus,
    });
    navigate(`/hr/employees/${employee.id}/profile`);
  };

  const handleAddEmployee = async (newEmployee: any) => {
    try {
      const payload = {
        firstName: newEmployee.firstName ?? "",
        lastName: newEmployee.lastName ?? "",
        gender: newEmployee.gender ?? undefined,
        prefix: newEmployee.prefix ?? undefined,
        maritalStatus: newEmployee.maritalStatus ?? undefined,
        dateOfBirth: newEmployee.dateOfBirth ?? undefined,
        joinDate: newEmployee.joinDate ?? undefined,
        phoneNo: newEmployee.phoneNo ?? undefined,
        altPhone: newEmployee.altPhone ?? undefined,
        departmentId: newEmployee.departmentId !== undefined && newEmployee.departmentId !== "" ? Number(newEmployee.departmentId) : undefined,
        role: newEmployee.role ?? "USER",
      };

      const created = await hrService.createEmployee(payload);

      if (created) {
        // if create returned an id and address fields were provided, add address
        try {
          if (created?.id) {
            // prefer common keys if present
            const street = newEmployee.street ?? newEmployee.line1 ?? newEmployee.addressLine1 ?? newEmployee.line_1;
            const city = newEmployee.city ?? undefined;
            const state = newEmployee.state ?? undefined;
            const country = newEmployee.country ?? undefined;
            const postalCode = newEmployee.zipCode ?? newEmployee.postalCode ?? newEmployee.postal_code ?? undefined;

            if (street || city || state || country || postalCode) {
              const payloadAddr = {
                line1: street ?? "",
                line2: newEmployee.line2 ?? newEmployee.addressLine2 ?? "",
                city: city ?? "",
                state: state ?? "",
                country: country ?? "",
                postalCode: postalCode ?? "",
                addressType: newEmployee.addressType ?? "HOME",
              };

              await addressService.addAddress(Number(created.id), payloadAddr);
            }
          }
        } catch (err) {
          console.warn("Failed to add address after create:", err);
        }
        // Show success toast with username/email from server response (do not show password)
        const { username, email } = created as any;
        toast.success(
          `Employee created successfully.\nUsername: ${username || "-"}\nEmail: ${email || "-"}`
        );

        // refresh from server to reflect DB state (in case server enriches/normalizes payload)
        const list = await hrService.listEmployees();
        setEmployees(list);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create employee";
      console.error("EmployeesPage.handleAddEmployee -> error:", err?.response?.data ?? err);
      toast.error(String(msg));
    }
  };

  // load employees
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await hrService.listEmployees();
        console.log("EmployeesPage -> loaded employees", Array.isArray(list) ? list.length : typeof list, list?.slice?.(0,3));
        if (mounted) setEmployees(list);
      } catch (err: any) {
        console.error("EmployeesPage -> failed to load employees:", err?.response?.data ?? err);
        setEmployees([]);
        const msg = err?.response?.data?.message || err?.message || "Failed to load employees";
        toast.error(String(msg));
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Refresh employees list when an employee is updated elsewhere (profile page)
  useEffect(() => {
    const handler = async (e: Event) => {
      try {
        const list = await hrService.listEmployees();
        setEmployees(list);
        console.log("EmployeesPage -> refreshed after employee:updated", (e as CustomEvent).detail);
      } catch (err) {
        console.error("EmployeesPage -> refresh after update failed:", err);
      }
    };
    window.addEventListener("employee:updated", handler as EventListener);
    return () => window.removeEventListener("employee:updated", handler as EventListener);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Employee Overview</h2>
      </div>
      {showAddEmployee && (
        <AddEmployeeModal
          isOpen={showAddEmployee}
          onAdd={(employee: any) => {
            handleAddEmployee(employee);
            setShowAddEmployee(false);
          }}
          onClose={() => setShowAddEmployee(false)}
        />
      )}{" "}
      <EmployeeStats employees={employees} onFilter={setStatusFilter} />
      <div className="rounded-md border bg-white">
        <div className="p-4">
          <EmployeeSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            showAdd={true}
            onAddClick={() => setShowAddEmployee(true)}
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
