import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/ui/data-table";
import { EMPLOYEE_COLUMNS } from "@/modules/hr/columns/employees-columns";
import { hrService } from "@/service/hr.service";
import { addressService } from "@/service/addressService";
import { currentJobService } from "@/service/currentJobService";
import type { Employee } from "@/types/hr";
import { useEmployeeSelection } from "@/context/employee-selection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmployeeFilters } from "@/modules/hr/components/employee-filters";
import { EmployeeStats } from "@/modules/hr/components/employee-stats";
import { AddEmployeeModal } from "@/context/employee-selection";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, Users2, LayoutGrid } from "lucide-react";
import { cn, isSecurityAdmin } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";

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

/**
 * Fills in `department` and `designation` for an employee from their
 * EmployeeCurrentJob. The backend already returns `designation` derived from
 * the job code's title via EmployeeService.toDTO — this hydrate step is the
 * belt-and-braces fallback that also runs while the row is on-screen, so the
 * overview never shows an empty Designation column when a current job exists.
 */
async function hydrateEmployeeFromCurrentJob(emp: Employee): Promise<Employee> {
  if (!emp.id) return emp;
  try {
    const currentJob = await currentJobService.get(Number(emp.id));
    if (!currentJob) return emp;

    const cj = currentJob as any;
    const departmentName =
      cj.departmentName ||
      cj.department?.name ||
      cj.department?.departmentName ||
      "";
    const jobTitle = cj.job?.title || cj.jobTitle || "";

    const next: Employee = { ...emp };
    if (departmentName) next.department = departmentName;
    // Prefer backend-supplied designation; fall back to the current job's title.
    if (!next.designation && jobTitle) next.designation = jobTitle;
    return next;
  } catch {
    console.debug("No current job for employee:", emp.id);
    return emp;
  }
}

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const navigate = useNavigate();
  const { setSelected } = useEmployeeSelection();
  const { permissions, permissionsLoading, user, company } = useAuth();
  const [canViewEmployees, setCanViewEmployees] = useState(false);

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

      const matchesStatus =
        !statusFilter || normalize(employee.status) === desired;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, employees]);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelected({
      id: employee.id?.toString() || "",
      employeeNo: employee.employeeNo?.toString() || "",
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
        companyId: company?.id != null ? Number(company.id) : undefined,
        firstName: newEmployee.firstName ?? "",
        lastName: newEmployee.lastName ?? "",
        gender: newEmployee.gender ?? undefined,
        prefix: newEmployee.prefix ?? undefined,
        maritalStatus: newEmployee.maritalStatus ?? undefined,
        dateOfBirth: newEmployee.dateOfBirth ?? undefined,
        birthplace: newEmployee.birthplace ?? undefined,
        hometown: newEmployee.hometown ?? undefined,
        nationality: newEmployee.nationality ?? undefined,
        religion: newEmployee.religion ?? undefined,
        identification:
          newEmployee.identification ?? newEmployee.nationalId ?? undefined,
        joinDate: newEmployee.joinDate ?? undefined,
        departmentId:
          newEmployee.departmentId !== undefined &&
          newEmployee.departmentId !== ""
            ? Number(newEmployee.departmentId)
            : undefined,
        companyRole: newEmployee.companyRole ?? undefined,
        role: newEmployee.role ?? "USER", // Keep security role for permissions
        // username/email/password removed from add employee flow
      };

      const created = await hrService.createEmployee(payload);

      if (created) {
        // if create returned an id and address fields were provided, add address
        try {
          if (created?.id) {
            // prefer common keys if present
            const street =
              newEmployee.street ??
              newEmployee.line1 ??
              newEmployee.addressLine1 ??
              newEmployee.line_1;
            const city = newEmployee.city ?? undefined;
            const state = newEmployee.state ?? undefined;
            const country = newEmployee.country ?? undefined;
            const postalCode =
              newEmployee.zipCode ??
              newEmployee.postalCode ??
              newEmployee.postal_code ??
              undefined;

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
          `Employee created successfully.\nUsername: ${username || "-"}\nEmail: ${email || "-"}`,
        );

        // refresh from server to reflect DB state (in case server enriches/normalizes payload)
        const list = await hrService.listEmployees();
        setEmployees(list);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create employee";
      console.error(
        "EmployeesPage.handleAddEmployee -> error:",
        err?.response?.data ?? err,
      );
      toast.error(String(msg));
    }
  };

  // load employees with department from current job
  const isAdmin = isSecurityAdmin(user?.role);

  // determine canViewEmployees once when permissions change
  useEffect(() => {
    // Admin bypass (permissions === null or JWT security role)
    if (isAdmin || permissions === null) {
      setCanViewEmployees(true);
      return;
    }

    if (permissionsLoading) return;

    // permissions is a map of module -> caps; empty map => deny
    if (!permissions || Object.keys(permissions).length === 0) {
      setCanViewEmployees(false);
      return;
    }

    const hasView = (moduleId: string) => {
      const perm = (permissions as any)?.[moduleId];
      if (!perm) return false;
      return !!(
        (perm.viewAll as boolean) ||
        (perm.viewOwn as boolean) ||
        (perm.view_all as boolean) ||
        (perm.view_own as boolean)
      );
    };

    const has =
      hasView("EMPLOYEE_PROFILE") || hasView("CURRENT_JOB");
    setCanViewEmployees(!!has);
  }, [permissions, permissionsLoading, isAdmin]);

  // Load employees when we know user can view them
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (!isAdmin && !canViewEmployees) {
          setEmployees([]);
          return;
        }

        const list = await hrService.listEmployees();

        if (!mounted) return;

        if (list.length > 0) {
          const employeesWithDepartment = await Promise.all(
            list.map((emp) => hydrateEmployeeFromCurrentJob(emp)),
          );
          setEmployees(employeesWithDepartment);
        } else {
          setEmployees(list);
        }
      } catch (err: any) {
        console.error(
          "EmployeesPage -> failed to load employees:",
          err?.response?.data ?? err,
        );
        setEmployees([]);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load employees";
        toast.error(String(msg));
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [canViewEmployees, user, isAdmin, company?.id]);

  // permissionsLoading handled above; no local permissionsLoaded state

  // Refresh employees list when an employee is updated elsewhere (profile page)
  useEffect(() => {
    const handler = async () => {
      try {
        const list = await hrService.listEmployees();

        // Fetch current job data for each employee to get department + designation
        if (list.length > 0) {
          const employeesWithDepartment = await Promise.all(
            list.map((emp) => hydrateEmployeeFromCurrentJob(emp)),
          );
          setEmployees(employeesWithDepartment);
        } else {
          setEmployees(list);
        }
      } catch (err) {
        console.error("EmployeesPage -> refresh after update failed:", err);
      }
    };
    window.addEventListener("employee:updated", handler as EventListener);
    return () =>
      window.removeEventListener("employee:updated", handler as EventListener);
  }, []);

  const hasCreate = (moduleId: string) =>
    !!(permissions as any)?.[moduleId]?.create;

  const showAdd =
    isAdmin ||
    permissions === null ||
    permissionsLoading ||
    hasCreate("EMPLOYEE_PROFILE") ||
    hasCreate("CURRENT_JOB");

  return (
    <div className="p-6 space-y-4">
      {showAddEmployee && (
        <AddEmployeeModal
          isOpen={showAddEmployee}
          onAdd={(employee: any) => {
            handleAddEmployee(employee);
            setShowAddEmployee(false);
          }}
          onClose={() => setShowAddEmployee(false)}
        />
      )}

      {/* ── Page header banner ──────────────────────────────────────────── */}
      <PageHeader
        title="Employee Overview"
        description="Manage and monitor your organisation's workforce"
        variant="default"
        icon={<Users2 className="w-6 h-6" />}
        actions={
          showAdd && (
            <Button
              onClick={() => setShowAddEmployee(true)}
              className="gap-2 shrink-0 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm shadow-sm transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
          )
        }
      />

      {/* ── KPI stat cards ───────────────────────────────────────────────── */}
      <EmployeeStats
        employees={employees}
        onFilter={setStatusFilter}
        activeFilter={statusFilter}
      />

      {/* ── Employee table ───────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
              <Users2 className="h-4 w-4 text-slate-600" />
            </div>
            Employee Directory
            <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
              {filteredEmployees.length} of {employees.length}
            </span>
          </CardTitle>
        </CardHeader>
        <Separator />

        {/* Search + filter toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <LayoutGrid className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, dept, designation…"
              className="h-9 pl-9 pr-9 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <EmployeeFilters
            onFilterStatus={setStatusFilter}
            activeFilter={statusFilter}
          />
        </div>

        <div
          className={cn(
            "px-5 pb-5",
            filteredEmployees.length === 0 &&
              "min-h-[200px] flex items-center justify-center",
          )}
        >
          {filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
              <Users2 className="h-10 w-10 opacity-30" />
              <p className="text-sm">
                No employees match your current filters.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter(null);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <EmployeeTable
              data={filteredEmployees}
              onSelect={handleEmployeeSelect}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
