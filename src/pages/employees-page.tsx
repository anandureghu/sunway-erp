import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/datatable";
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
import { UserPlus, Users2, Search } from "lucide-react";
import { cn, isSecurityAdmin } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { ImportEmployeesCsvDialog } from "@/pages/employees/import-employees-csv-dialog";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import { fetchDepartments } from "@/service/departmentService";
import type { PageResult } from "@/types/page";
import type { Row } from "@tanstack/react-table";

type DepartmentOption = { id: number; departmentName?: string; name?: string };

/** Normalize UI filter labels ("under probation") to backend enum names. */
function toApiStatus(raw: string | null): string | null {
  if (!raw) return null;
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

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
    const jobCode = cj.job?.code || cj.jobCode || "";
    const divisionName =
      cj.divisionName || cj.division?.name || cj.division?.divisionName || "";

    const next: Employee = { ...emp };
    if (departmentName) next.department = departmentName;
    // Prefer backend-supplied designation; fall back to the current job's title.
    if (!next.designation && jobTitle) next.designation = jobTitle;
    if (!next.jobCode && jobCode) next.jobCode = jobCode;
    if (!next.divisionName && divisionName) next.divisionName = divisionName;
    // Employment type/category also come from the current job — fall back to it.
    if (!next.employmentCategory && cj.employmentCategory)
      next.employmentCategory = cj.employmentCategory;
    if (!next.employmentType && cj.employmentType)
      next.employmentType = cj.employmentType;
    return next;
  } catch {
    console.debug("No current job for employee:", emp.id);
    return emp;
  }
}

/**
 * Hydrate only the rows actually missing a displayed field (department,
 * designation, employmentCategory). The backend usually supplies these, so this
 * avoids firing a per-employee current-job fetch for every row (an N+1 on each
 * load) while never leaving a displayed column emptier than before.
 */
async function hydrateEmployees(list: Employee[]): Promise<Employee[]> {
  return Promise.all(
    list.map((emp) =>
      emp.department && emp.designation && emp.employmentCategory
        ? Promise.resolve(emp)
        : hydrateEmployeeFromCurrentJob(emp),
    ),
  );
}

export default function EmployeesPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  /** Full-directory snapshot for KPI cards (status breakdown). */
  const [statsEmployees, setStatsEmployees] = useState<Employee[]>([]);
  const navigate = useNavigate();
  const { setSelected } = useEmployeeSelection();
  const { permissions, permissionsLoading, user, company } = useAuth();
  const [canViewEmployees, setCanViewEmployees] = useState(false);

  const isAdmin = isSecurityAdmin(user?.role);

  const filters = useMemo(
    () => ({
      status: toApiStatus(statusFilter),
      departmentId,
    }),
    [statusFilter, departmentId],
  );

  const fetchPage = useCallback(
    async (params: {
      page: number;
      size: number;
      search: string;
      status: string | null;
      departmentId: number | null;
    }): Promise<PageResult<Employee>> => {
      const page = await hrService.listEmployeesPage({
        page: params.page,
        size: params.size,
        search: params.search,
        status: params.status,
        departmentId: params.departmentId,
      });
      const content = page.content?.length
        ? await hydrateEmployees(page.content)
        : (page.content ?? []);
      return { ...page, content };
    },
    [],
  );

  const {
    rows,
    loading,
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    pageCount,
    reload,
  } = useServerPagedList<
    Employee,
    { status: string | null; departmentId: number | null }
  >({
    fetcher: fetchPage,
    filters,
    enabled: isAdmin || canViewEmployees,
    errorMessage: "Failed to load employees",
  });

  useEffect(() => {
    if (!company?.id) return;
    let cancelled = false;
    fetchDepartments(Number(company.id)).then((list) => {
      if (cancelled || !Array.isArray(list)) return;
      setDepartments(list as DepartmentOption[]);
    });
    return () => {
      cancelled = true;
    };
  }, [company?.id]);

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
        middleName: newEmployee.middleName ?? undefined,
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

        reload();
        void refreshStats();
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

    const has = hasView("EMPLOYEE_PROFILE") || hasView("CURRENT_JOB");
    setCanViewEmployees(!!has);
  }, [permissions, permissionsLoading, isAdmin]);

  const refreshStats = useCallback(async () => {
    if (!isAdmin && !canViewEmployees) {
      setStatsEmployees([]);
      return;
    }
    try {
      const list = await hrService.listEmployees();
      setStatsEmployees(list);
    } catch {
      setStatsEmployees([]);
    }
  }, [canViewEmployees, isAdmin]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats, company?.id]);

  // Refresh when an employee is updated elsewhere (profile page)
  useEffect(() => {
    const handler = () => {
      reload();
      void refreshStats();
    };
    window.addEventListener("employee:updated", handler as EventListener);
    return () =>
      window.removeEventListener("employee:updated", handler as EventListener);
  }, [reload, refreshStats]);

  const hasCreate = (moduleId: string) =>
    !!(permissions as any)?.[moduleId]?.create;

  const showAdd =
    isAdmin ||
    permissions === null ||
    permissionsLoading ||
    hasCreate("EMPLOYEE_PROFILE") ||
    hasCreate("CURRENT_JOB");

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter(null);
    setDepartmentId(null);
  };

  const directoryTotal = Math.max(statsEmployees.length, totalElements);

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
            <div className="flex gap-2">
              <ImportEmployeesCsvDialog
                onImported={() => {
                  reload();
                  void refreshStats();
                }}
              />
              <Button
                onClick={() => setShowAddEmployee(true)}
                className="gap-2 shrink-0 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm shadow-sm transition-all"
              >
                <UserPlus className="h-4 w-4" />
                Add Employee
              </Button>
            </div>
          )
        }
      />

      {/* ── KPI stat cards ───────────────────────────────────────────────── */}
      <EmployeeStats
        employees={statsEmployees}
        totalOverride={
          !statusFilter && !departmentId && !searchInput.trim()
            ? totalElements
            : undefined
        }
        onFilter={setStatusFilter}
        activeFilter={statusFilter}
      />

      {/*
        LOCKED UI — Employee Register directory card
        Do not change toolbar layout, typography scale, or column set without asking the user first.
        Typography aligned with Company HR Policies (section ~text-xs bold uppercase;
        labels ~text-[11px]; body ~text-sm).
        Toolbar: search | All departments | status chips (single row when space allows).
      */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Employee Register
            <span className="ml-auto text-[11px] font-normal normal-case tracking-normal text-slate-400 tabular-nums">
              {loading
                ? "Loading…"
                : `${totalElements.toLocaleString()} of ${directoryTotal.toLocaleString()} employees`}
            </span>
          </CardTitle>
        </CardHeader>
        <Separator />

        <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, code, designation"
              className="h-9 rounded-full border-slate-200 pl-9 pr-9 text-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={departmentId ?? ""}
            onChange={(e) =>
              setDepartmentId(e.target.value ? Number(e.target.value) : null)
            }
            aria-label="Filter by department"
            className={cn(
              "h-9 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700",
              "focus:outline-none focus:ring-2 focus:ring-slate-200",
            )}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.departmentName || d.name || `Department ${d.id}`}
              </option>
            ))}
          </select>

          <EmployeeFilters
            onFilterStatus={setStatusFilter}
            activeFilter={statusFilter}
          />
        </div>

        <div
          className={cn(
            "px-5 pb-5",
            !loading &&
              rows.length === 0 &&
              "min-h-[200px] flex items-center justify-center",
          )}
        >
          {loading && rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
              <p className="text-sm">Loading employees…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
              <Users2 className="h-10 w-10 opacity-30" />
              <p className="text-sm">
                No employees match your current filters.
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <DataTable<Employee, unknown>
              columns={EMPLOYEE_COLUMNS}
              data={rows}
              hideSlNo
              onRowClick={(row: Row<Employee>) =>
                handleEmployeeSelect(row.original)
              }
              serverPagination={{
                total: totalElements,
                pageIndex: page,
                pageSize,
                pageCount: Math.max(pageCount, 1),
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
              }}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
