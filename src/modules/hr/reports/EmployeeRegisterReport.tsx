import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Loader2,
  Lock,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import {
  contractLabel,
  employeeReportService,
  fmtReportDate,
  reportStatusMeta,
  type EmployeeReportRow,
} from "@/service/employeeReportService";

/**
 * HR Reports → Employee Register. Every (non-archived) employee from live data:
 * name, status, nationality, department / division, designation, grade, join date,
 * years of service, contract type and gross salary (salary only for users who may
 * see it). Click a row to open that employee's summary.
 */

const NAVY = "#1F3A6E";
const NAVY_DARK = "#16294E";
const DEPT_COLORS = [
  "#1F3A6E", "#1E6B4F", "#5B3B8C", "#A9631A", "#1E6E8C", "#8A1C36", "#0E7490", "#475569",
];
const EXIT = new Set(["RESIGNED", "TERMINATED", "RETIRED"]);

type SortKey =
  | "fullName"
  | "status"
  | "nationality"
  | "departmentName"
  | "designation"
  | "gradeCode"
  | "joinDate"
  | "yearsOfService"
  | "contract"
  | "grossSalary";

type StatusFilter = "" | "WORKING" | "UNDER_PROBATION" | "ON_LEAVE" | "EXITING" | "INACTIVE";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "WORKING", label: "Active" },
  { value: "UNDER_PROBATION", label: "Probation" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "EXITING", label: "Exiting" },
  { value: "INACTIVE", label: "Inactive" },
];

const money = (n?: number | null) =>
  n == null
    ? "—"
    : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function EmployeeRegisterReport({
  onOpenEmployee,
}: {
  onOpenEmployee: (id: number) => void;
}) {
  const { company } = useAuth();
  const currency = company?.currency?.currencyCode ?? "";

  const [rows, setRows] = useState<EmployeeReportRow[]>([]);
  const [salaryVisible, setSalaryVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [sortKey, setSortKey] = useState<SortKey>("departmentName");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  useEffect(() => {
    let cancelled = false;
    employeeReportService
      .register()
      .then((r) => {
        if (cancelled) return;
        setRows(r.rows);
        setSalaryVisible(r.salaryVisible);
      })
      .catch((err) => toast.error(getApiErrorMessage(err, "Could not load the employee register.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Working headcount = everyone still employed (not INACTIVE).
  const working = useMemo(
    () => rows.filter((r) => String(r.status).toUpperCase() !== "INACTIVE"),
    [rows],
  );

  const departments = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.departmentName || "Unassigned"))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [rows],
  );
  const deptColor = (name: string) =>
    DEPT_COLORS[Math.max(departments.indexOf(name), 0) % DEPT_COLORS.length];

  const kpis = useMemo(() => {
    const withService = working.filter((r) => r.yearsOfService != null);
    const avg = withService.length
      ? withService.reduce((a, r) => a + (r.yearsOfService ?? 0), 0) / withService.length
      : 0;
    const count = (s: string) => rows.filter((r) => String(r.status).toUpperCase() === s).length;
    return {
      headcount: working.length,
      departments: new Set(working.map((r) => r.departmentName || "Unassigned")).size,
      avgService: avg,
      probation: count("UNDER_PROBATION"),
      onLeave: count("ON_LEAVE"),
      exiting: rows.filter((r) => EXIT.has(String(r.status).toUpperCase())).length,
      inactive: count("INACTIVE"),
      payroll: working.reduce((a, r) => a + (r.grossSalary ?? 0), 0),
    };
  }, [rows, working]);

  const deptCounts = useMemo(() => {
    const m = new Map<string, number>();
    working.forEach((r) => {
      const d = r.departmentName || "Unassigned";
      m.set(d, (m.get(d) ?? 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [working]);

  const contractSplit = useMemo(() => {
    const m = new Map<string, number>();
    working.forEach((r) => {
      const c = contractLabel(r.contractType, r.employmentCategory);
      m.set(c, (m.get(c) ?? 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [working]);

  const serviceBands = useMemo(() => {
    const b = [0, 0, 0, 0];
    working.forEach((r) => {
      const y = r.yearsOfService ?? 0;
      if (y < 1) b[0]++;
      else if (y < 3) b[1]++;
      else if (y < 7) b[2]++;
      else b[3]++;
    });
    return [
      ["Under 1 year", b[0], "#A9631A"],
      ["1–3 years", b[1], "#1E6E8C"],
      ["3–7 years", b[2], "#1F3A6E"],
      ["Over 7 years", b[3], "#1E6B4F"],
    ] as [string, number, string][];
  }, [working]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      const status = String(r.status).toUpperCase();
      if (statusFilter === "WORKING" && status !== "ACTIVE") return false;
      if (statusFilter === "EXITING" && !EXIT.has(status)) return false;
      if (
        statusFilter &&
        !["WORKING", "EXITING"].includes(statusFilter) &&
        status !== statusFilter
      )
        return false;
      if (dept && (r.departmentName || "Unassigned") !== dept) return false;
      if (q) {
        const hay = [r.fullName, r.employeeNo, r.designation, r.jobCode, r.nationality]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const val = (r: EmployeeReportRow): string | number => {
      switch (sortKey) {
        case "contract":
          return contractLabel(r.contractType, r.employmentCategory);
        case "yearsOfService":
          return r.yearsOfService ?? -1;
        case "grossSalary":
          return r.grossSalary ?? -1;
        default:
          return String((r as unknown as Record<string, unknown>)[sortKey] ?? "");
      }
    };
    return [...list].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      if (typeof x === "number" && typeof y === "number") return (x - y) * sortDir;
      return String(x).localeCompare(String(y)) * sortDir;
    });
  }, [rows, query, dept, statusFilter, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(1);
    }
  };

  const exportCsv = () => {
    const header = [
      "Employee No", "First name", "Middle name", "Last name", "Status", "Nationality",
      "Department", "Division", "Designation", "Grade", "Join date", "Years of service",
      "Contract type", ...(salaryVisible ? [`Gross salary${currency ? ` (${currency})` : ""}`] : []),
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = filtered.map((r) =>
      [
        r.employeeNo, r.firstName, r.middleName, r.lastName, reportStatusMeta(r.status).label,
        r.nationality, r.departmentName, r.divisionName, r.designation, r.gradeCode,
        r.joinDate, r.yearsOfService, contractLabel(r.contractType, r.employmentCategory),
        ...(salaryVisible ? [r.grossSalary ?? ""] : []),
      ]
        .map(esc)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee-register-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading employee register…
      </div>
    );
  }

  const SortTh = ({
    k,
    label,
    className,
  }: {
    k: SortKey;
    label: string;
    className?: string;
  }) => (
    <th
      onClick={() => toggleSort(k)}
      className={cn(
        "cursor-pointer select-none whitespace-nowrap border-b border-slate-300 bg-slate-50 px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider",
        sortKey === k ? "text-[#1F3A6E]" : "text-slate-400 hover:text-[#1F3A6E]",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k &&
          (sortDir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </span>
    </th>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      {/* ── Masthead ── */}
      <div className="px-6 pb-5 pt-5 text-white sm:px-8" style={{ background: NAVY }}>
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9FB4D8]">
          <span>HR Reports · Employee Register</span>
          <span>{company?.companyName ?? ""}</span>
          <span>As at {today}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">Employee Register</h2>
            <p className="mt-1 max-w-3xl text-[13px] text-[#C9D7EE]">
              Every employee with department, designation, grade, service, contract and status —
              from live HR records.
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/30 px-3 text-xs hover:bg-white/15"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="flex flex-wrap text-white" style={{ background: NAVY_DARK }}>
        {[
          ["Headcount", kpis.headcount, ""],
          ["Departments", kpis.departments, ""],
          ["Average service", kpis.avgService.toFixed(1), "years"],
          ["On probation", kpis.probation, "", kpis.probation ? "text-[#F0C98A]" : ""],
          ["On leave", kpis.onLeave, ""],
          ["Exiting", kpis.exiting, "", kpis.exiting ? "text-[#F2A9B2]" : ""],
          ["Inactive", kpis.inactive, ""],
          ...(salaryVisible
            ? [["Monthly payroll", money(kpis.payroll), currency] as [string, string, string]]
            : []),
        ].map(([label, value, unit, cls]) => (
          <div key={String(label)} className="min-w-[120px] flex-1 border-r border-white/10 px-5 py-3">
            <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.13em] text-[#8FA5CC]">
              {label}
            </p>
            <p className={cn("text-lg font-semibold", cls)}>
              {value}
              {unit && <small className="ml-1 text-[11px] font-normal text-[#B9C7E2]">{unit}</small>}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-7 px-6 py-6 sm:px-8">
        {/* ── Headcount + composition ── */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.25fr_0.75fr]">
          <section>
            <SectionTitle title="Headcount by department" note="Current employees" />
            {deptCounts.length === 0 ? (
              <p className="text-sm text-slate-400">No employees yet.</p>
            ) : (
              deptCounts.map(([name, n]) => (
                <div key={name} className="mb-2.5">
                  <div className="mb-1 flex items-baseline gap-2 text-[12.5px]">
                    <span className="h-2 w-2 rounded-full" style={{ background: deptColor(name) }} />
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className="ml-auto font-mono text-[11.5px] text-slate-500">
                      {n} · {Math.round((n / Math.max(working.length, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-slate-100">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${(n / Math.max(deptCounts[0][1], 1)) * 100}%`,
                        background: deptColor(name),
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </section>
          <section>
            <SectionTitle title="Composition" />
            <SplitBar
              label="Contract type"
              groups={contractSplit.map(([k, n], i) => [k, n, DEPT_COLORS[i % DEPT_COLORS.length]])}
            />
            <div className="h-5" />
            <SplitBar label="Length of service" groups={serviceBands} />
          </section>
        </div>

        {/* ── Register ── */}
        <section>
          <SectionTitle title="Employee register" note={`${filtered.length} of ${rows.length} employees`} />
          <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, code, designation"
                className="h-8 w-64 rounded-md border border-slate-300 bg-white pl-8 pr-2 text-[13px] outline-none focus:border-[#1F3A6E]"
              />
            </div>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-[13px] outline-none focus:border-[#1F3A6E]"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value || "all"}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "h-8 rounded-md border px-2.5 text-[12.5px] transition-colors",
                  statusFilter === f.value
                    ? "border-[#1F3A6E] bg-[#1F3A6E] text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-[#1F3A6E] hover:text-[#1F3A6E]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[1100px] border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <SortTh k="fullName" label="Employee" />
                  <SortTh k="status" label="Status" />
                  <SortTh k="nationality" label="Nationality" />
                  <SortTh k="departmentName" label="Department / Division" />
                  <SortTh k="designation" label="Designation" />
                  <SortTh k="gradeCode" label="Grade" />
                  <SortTh k="joinDate" label="Joined" />
                  <SortTh k="yearsOfService" label="Service" className="text-right" />
                  <SortTh k="contract" label="Contract" />
                  <SortTh
                    k="grossSalary"
                    label={`Gross${currency ? ` (${currency})` : ""}`}
                    className="text-right"
                  />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const meta = reportStatusMeta(r.status);
                  const d = r.departmentName || "Unassigned";
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onOpenEmployee(r.id)}
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-[#EEF2F9]"
                      title="Open employee summary"
                    >
                      <td className="px-2.5 py-2 align-top">
                        <p className="font-semibold text-slate-800">{r.fullName || "—"}</p>
                        <p className="font-mono text-[11px] text-slate-400">{r.employeeNo ?? "—"}</p>
                      </td>
                      <td className="px-2.5 py-2 align-top">
                        <span
                          className={cn(
                            "whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-wide",
                            meta.cls,
                          )}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 align-top text-slate-600">{r.nationality || "—"}</td>
                      <td className="px-2.5 py-2 align-top">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: deptColor(d) }} />
                          {r.departmentName || <span className="text-slate-400">Unassigned</span>}
                        </span>
                        {r.divisionName && (
                          <p className="pl-3 text-[11px] text-slate-400">{r.divisionName}</p>
                        )}
                      </td>
                      <td className="px-2.5 py-2 align-top">
                        {r.designation || "—"}
                        {r.jobCode && (
                          <p className="font-mono text-[11px] text-slate-400">{r.jobCode}</p>
                        )}
                      </td>
                      <td className="px-2.5 py-2 align-top font-mono text-[11.5px] text-slate-500">
                        {r.gradeCode || "—"}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-2 align-top font-mono text-[11.5px] text-slate-500">
                        {fmtReportDate(r.joinDate)}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-2 text-right align-top font-mono text-[12px]">
                        {r.yearsOfService != null ? `${r.yearsOfService.toFixed(1)} y` : "—"}
                        {r.serviceLabel && (
                          <p className="text-[10.5px] text-slate-400">{r.serviceLabel}</p>
                        )}
                      </td>
                      <td className="px-2.5 py-2 align-top">
                        {contractLabel(r.contractType, r.employmentCategory)}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-2 text-right align-top font-mono text-[12px]">
                        {salaryVisible ? (
                          money(r.grossSalary)
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-300" title="Requires salary / payroll view permission">
                            <Lock className="h-3 w-3" /> ·····
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-sm text-slate-400">
                      <Users className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                      No employees match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!salaryVisible && (
            <p className="mt-2 text-[11px] text-slate-400">
              Gross salary is hidden — it requires the Salary or Payroll view-all permission.
            </p>
          )}
        </section>

        <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
          <span>HR Reports · Employee Register</span>
          <span>Confidential — HR use</span>
          <span className="ml-auto">
            Generated {today} · {salaryVisible ? "Includes payroll data" : "Payroll data withheld"}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 border-b-[1.5px] border-[#1F3A6E] pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1F3A6E]">
      {title}
      {note && (
        <span className="ml-auto font-sans text-[11px] normal-case tracking-normal text-slate-400">
          {note}
        </span>
      )}
    </h3>
  );
}

function SplitBar({ label, groups }: { label: string; groups: [string, number, string][] }) {
  const total = groups.reduce((a, g) => a + g[1], 0);
  return (
    <div>
      <p className="mb-1.5 text-xs text-slate-500">{label}</p>
      <div className="mb-2 flex h-6 overflow-hidden rounded bg-slate-100">
        {total > 0 &&
          groups.map(([k, n, c]) =>
            n > 0 ? (
              <div key={k} title={`${k}: ${n}`} style={{ width: `${(n / total) * 100}%`, background: c }} />
            ) : null,
          )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {groups.map(([k, n, c]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: c }} />
            {k} <b className="font-mono text-[11.5px] text-slate-800">{n}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
