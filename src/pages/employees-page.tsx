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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmployeeFilters } from "@/modules/hr/components/employee-filters";
import { EmployeeStats } from "@/modules/hr/components/employee-stats";
import { AddEmployeeModal } from "@/context/employee-selection";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, Users2, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

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

// ── Department distribution widget ────────────────────────────────────────────
const DepartmentBreakdown = ({ employees }: { employees: Employee[] }) => {
  const depts = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((e) => {
      const d = e.department?.trim();
      if (d) map.set(d, (map.get(d) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [employees]);

  if (depts.length === 0) return null;
  const max = depts[0][1];

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100">
            <LayoutGrid className="h-3.5 w-3.5 text-violet-600" />
          </div>
          Department Headcount
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-2.5">
        {depts.map(([dept, count]) => (
          <div key={dept}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground truncate max-w-[65%]">{dept}</span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">{count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.round((count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ── Workforce breakdown widget ─────────────────────────────────────────────────
const WorkforceBreakdown = ({ employees }: { employees: Employee[] }) => {
  const breakdown = useMemo(() => {
    const normalize = (s?: string | null) =>
      String(s ?? "").trim().toUpperCase();

    const total  = employees.length;
    const male   = employees.filter((e) => normalize(e.gender) === "MALE").length;
    const female = employees.filter((e) => normalize(e.gender) === "FEMALE").length;
    const other  = total - male - female;

    const depts  = new Set(employees.map((e) => e.department).filter(Boolean)).size;
    const joined = employees.filter((e) => {
      if (!e.joinDate) return false;
      const y = new Date(e.joinDate).getFullYear();
      return y === new Date().getFullYear();
    }).length;

    return { total, male, female, other, depts, joined };
  }, [employees]);

  const rows = [
    { label: "Male",              value: breakdown.male,   color: "bg-blue-500",    of: breakdown.total },
    { label: "Female",            value: breakdown.female, color: "bg-pink-500",    of: breakdown.total },
    { label: "Departments",       value: breakdown.depts,  color: "bg-violet-500",  of: null },
    { label: "Joined this year",  value: breakdown.joined, color: "bg-emerald-500", of: null },
  ];

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100">
            <Users2 className="h-3.5 w-3.5 text-blue-600" />
          </div>
          Workforce Breakdown
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", r.color)} />
            <span className="flex-1 text-xs text-muted-foreground">{r.label}</span>
            <span className="text-sm font-bold tabular-nums">{r.value}</span>
            {r.of !== null && r.of > 0 && (
              <span className="text-xs text-muted-foreground w-10 text-right">
                {Math.round((r.value / r.of) * 100)}%
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const navigate = useNavigate();
  const { setSelected } = useEmployeeSelection();
  const { permissions, permissionsLoading, user } = useAuth();
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
        // Use companyRole for display (human-readable) - backend will handle both fields
        companyRole: newEmployee.companyRole ?? newEmployee.role ?? "Employee",
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
  // determine canViewEmployees once when permissions change
  useEffect(() => {
    // Admin bypass (permissions === null)
    if (permissions === null) {
      setCanViewEmployees(true);
      return;
    }

    if (permissionsLoading) return;

    // permissions is a map of module -> caps; empty map => deny
    if (!permissions || Object.keys(permissions).length === 0) {
      setCanViewEmployees(false);
      return;
    }

    const hasPermission = (moduleId: string) => {
      const perm = (permissions as any)?.[moduleId];
      if (!perm) return false;
      return !!(
        (perm.viewAll as boolean) ||
        (perm.viewOwn as boolean) ||
        (perm.view_all as boolean) ||
        (perm.view_own as boolean)
      );
    };

    const has = hasPermission("EMPLOYEE_PROFILE") || hasPermission("CURRENT_JOB");
    setCanViewEmployees(!!has);
  }, [permissions, permissionsLoading]);

  // Load employees when we know user can view them
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const isAdmin = (user?.role ?? "").toString().toUpperCase() === "ADMIN" ||
          (user?.role ?? "").toString().toUpperCase() === "SUPER_ADMIN";

        if (!isAdmin && !canViewEmployees) {
          setEmployees([]);
          return;
        }

        const list = await hrService.listEmployees();

        if (!mounted) return;

        if (list.length > 0) {
          const employeesWithDepartment = await Promise.all(
            list.map(async (emp) => {
              try {
                if (emp.id) {
                  const currentJob = await currentJobService.get(Number(emp.id));
                  if (currentJob) {
                    const deptName =
                      (currentJob as any).departmentName ||
                      (currentJob as any).department?.name ||
                      (currentJob as any).department?.departmentName ||
                      "";
                    if (deptName) return { ...emp, department: deptName };
                  }
                }
              } catch {
                console.debug("No current job for employee:", emp.id);
              }
              return emp;
            }),
          );
          setEmployees(employeesWithDepartment);
        } else {
          setEmployees(list);
        }
      } catch (err: any) {
        console.error("EmployeesPage -> failed to load employees:", err?.response?.data ?? err);
        setEmployees([]);
        const msg = err?.response?.data?.message || err?.message || "Failed to load employees";
        toast.error(String(msg));
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [canViewEmployees, user]);

  // permissionsLoading handled above; no local permissionsLoaded state

  // Refresh employees list when an employee is updated elsewhere (profile page)
  useEffect(() => {
    const handler = async () => {
      try {
        const list = await hrService.listEmployees();

        // Fetch current job data for each employee to get department
        if (list.length > 0) {
          const employeesWithDepartment = await Promise.all(
            list.map(async (emp) => {
              try {
                if (emp.id) {
                  const currentJob = await currentJobService.get(
                    Number(emp.id),
                  );
                  if (currentJob) {
                    const deptName =
                      (currentJob as any).departmentName ||
                      (currentJob as any).department?.name ||
                      (currentJob as any).department?.departmentName ||
                      "";
                    if (deptName) return { ...emp, department: deptName };
                  }
                }
              } catch {
                console.debug("No current job for employee:", emp.id);
              }
              return emp;
            }),
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

  const showAdd =
    permissions === null ||
    permissionsLoading ||
    ["employee_profile", "current_job"].some(
      (m) => (permissions as any)?.[m]?.create === true,
    );

  return (
    <div className="space-y-5 px-6 py-6 max-w-[1400px] mx-auto">

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

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and monitor your organisation's workforce
          </p>
        </div>
        {showAdd && (
          <Button
            onClick={() => setShowAddEmployee(true)}
            className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-sm
                       hover:from-violet-700 hover:to-blue-700 hover:shadow-md transition-all self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      {/* ── KPI stat cards ───────────────────────────────────────────────── */}
      <EmployeeStats
        employees={employees}
        onFilter={setStatusFilter}
        activeFilter={statusFilter}
      />

      {/* ── Insight widgets ──────────────────────────────────────────────── */}
      {employees.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <DepartmentBreakdown employees={employees} />
          <WorkforceBreakdown  employees={employees} />
        </div>
      )}

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

        <div className={cn("px-5 pb-5", filteredEmployees.length === 0 && "min-h-[200px] flex items-center justify-center")}>
          {filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
              <Users2 className="h-10 w-10 opacity-30" />
              <p className="text-sm">No employees match your current filters.</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setStatusFilter(null); }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <EmployeeTable data={filteredEmployees} onSelect={handleEmployeeSelect} />
          )}
        </div>
      </Card>
    </div>
  );
}
