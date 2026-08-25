import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  Wallet,
  ChevronDown,
  Building2,
  Users,
  Banknote,
  CalendarRange,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { cn, formatMoney, initialsFrom } from "@/lib/utils";
import {
  fetchPayrollSummary,
  type PayrollSummaryRow,
} from "@/service/payrollService";
import { fetchDepartments } from "@/service/departmentService";

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const fmtPeriod = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "—";
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  const sameYear =
    s && e && s.getFullYear() === e.getFullYear();
  const short = (d: Date | null, withYear: boolean) =>
    d && !Number.isNaN(d.getTime())
      ? d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          ...(withYear ? { year: "numeric" } : {}),
        })
      : "—";
  return `${short(s, !sameYear)} – ${short(e, true)}`;
};

type DeptGroup = {
  department: string;
  rows: PayrollSummaryRow[];
  gross: number;
  deductions: number;
  net: number;
};

// ── one department section (paginates its own runs) ─────────────────────────────
function DepartmentSection({
  group,
  currency,
  isClosed,
  onToggle,
}: {
  group: DeptGroup;
  currency: string;
  isClosed: boolean;
  onToggle: () => void;
}) {
  const g = group;
  const {
    pageItems,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    pageCount,
    total,
  } = usePagination(g.rows, 10);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* department header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            isClosed && "-rotate-90",
          )}
        />
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">{g.department}</p>
          <p className="text-xs text-slate-400">
            <Users className="mr-1 inline h-3 w-3" />
            {g.rows.length} run{g.rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="hidden shrink-0 gap-6 text-right sm:flex">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Gross
            </p>
            <p className="text-sm font-semibold tabular-nums text-slate-700">
              {formatMoney(g.gross, currency)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Net paid
            </p>
            <p className="text-sm font-bold tabular-nums text-emerald-700">
              {formatMoney(g.net, currency)}
            </p>
          </div>
        </div>
      </button>

      {/* rows */}
      {!isClosed && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-2 font-bold">Employee</th>
                  <th className="px-4 py-2 font-bold">Pay Period</th>
                  <th className="px-4 py-2 font-bold">Pay Date</th>
                  <th className="px-4 py-2 text-right font-bold">Gross</th>
                  <th className="px-4 py-2 text-right font-bold">Deductions</th>
                  <th className="px-4 py-2 text-right font-bold">Net Pay</th>
                  <th className="px-4 py-2 text-right font-bold">Type</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r, i) => (
                  <tr
                    key={`${r.payrollCode}-${r.employeeId}-${pageIndex}-${i}`}
                    className={cn(
                      "border-b border-slate-50",
                      i % 2 ? "bg-slate-50/30" : "bg-white",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-[10px] font-bold text-white">
                          {initialsFrom(r.employeeName ?? "")}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">
                            {r.employeeName || "—"}
                          </p>
                          <p className="truncate font-mono text-[10px] text-slate-400">
                            {r.employeeNo || `EMP-${r.employeeId}`}
                            {r.payrollCode ? ` · ${r.payrollCode}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {fmtPeriod(r.payPeriodStart, r.payPeriodEnd)}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-600">
                      {fmtDate(r.payDate)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-700">
                      {formatMoney(r.grossPay, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-rose-600">
                      {r.totalDeductions
                        ? `− ${formatMoney(r.totalDeductions, currency)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-emerald-700">
                      {formatMoney(r.netPayable, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          r.finalSettlement
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-slate-50 text-slate-500",
                        )}
                      >
                        {r.finalSettlement ? "Final settlement" : "Regular"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/60 text-xs font-semibold">
                  <td className="px-4 py-2 text-slate-500" colSpan={3}>
                    {g.department} subtotal
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-700">
                    {formatMoney(g.gross, currency)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-rose-600">
                    {formatMoney(g.deductions, currency)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-emerald-700">
                    {formatMoney(g.net, currency)}
                  </td>
                  <td className="px-4 py-2" />
                </tr>
              </tfoot>
            </table>
          </div>
          {total > pageSize && (
            <div className="border-t border-slate-100 px-3">
              <TablePagination
                total={total}
                pageIndex={pageIndex}
                pageSize={pageSize}
                pageCount={pageCount}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * HR Reports → Payroll Summary. Company-wide payroll history, grouped by department
 * so HR can quickly find and review each team's recent payroll activity, with a
 * pay-date range filter and per-department + company totals.
 */
export function PayrollSummaryPanel() {
  const { company, user } = useAuth();
  const currency = company?.currency?.currencyCode ?? "";
  const companyId =
    company?.id != null
      ? Number(company.id)
      : user?.companyId != null
        ? Number(user.companyId)
        : null;

  const [rows, setRows] = useState<PayrollSummaryRow[]>([]);
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [closed, setClosed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchPayrollSummary({ from, to });
    setRows(data);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  // The full department master — so the dropdown lists every department, even
  // ones that don't have any payroll runs yet.
  useEffect(() => {
    if (companyId == null) return;
    let mounted = true;
    fetchDepartments(companyId)
      .then((depts) => {
        if (mounted)
          setAllDepartments(
            ((depts ?? []) as Array<{ departmentName?: string }>)
              .map((d) => d.departmentName)
              .filter((n): n is string => !!n),
          );
      })
      .catch(() => mounted && setAllDepartments([]));
    return () => {
      mounted = false;
    };
  }, [companyId]);

  // Dropdown options = every company department (master list) ∪ any department that
  // shows up in the payroll rows (incl. "Unassigned"). "Unassigned" sorts last.
  const deptOptions = useMemo(() => {
    const set = new Set<string>(allDepartments);
    for (const r of rows) set.add(r.department || "Unassigned");
    return [...set].sort((a, b) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      return a.localeCompare(b);
    });
  }, [allDepartments, rows]);

  // Filter by department, then by employee / code / department text.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (deptFilter && (r.department || "Unassigned") !== deptFilter)
        return false;
      if (!q) return true;
      return [r.employeeName, r.employeeNo, r.payrollCode, r.department]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, deptFilter]);

  // Group by department (sorted; "Unassigned" last).
  const groups = useMemo<DeptGroup[]>(() => {
    const map = new Map<string, DeptGroup>();
    for (const r of filtered) {
      const key = r.department || "Unassigned";
      let g = map.get(key);
      if (!g) {
        g = { department: key, rows: [], gross: 0, deductions: 0, net: 0 };
        map.set(key, g);
      }
      g.rows.push(r);
      g.gross += r.grossPay || 0;
      g.deductions += r.totalDeductions || 0;
      g.net += r.netPayable || 0;
    }
    return [...map.values()].sort((a, b) => {
      if (a.department === "Unassigned") return 1;
      if (b.department === "Unassigned") return -1;
      return a.department.localeCompare(b.department);
    });
  }, [filtered]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => {
          acc.gross += r.grossPay || 0;
          acc.deductions += r.totalDeductions || 0;
          acc.net += r.netPayable || 0;
          return acc;
        },
        { gross: 0, deductions: 0, net: 0 },
      ),
    [filtered],
  );

  const toggle = (dept: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });

  const hasFilter = !!from || !!to || !!search || !!deptFilter;
  const clearFilters = () => {
    setFrom("");
    setTo("");
    setSearch("");
    setDeptFilter("");
  };

  const kpis = [
    {
      label: "Payroll Runs",
      value: String(filtered.length),
      icon: Wallet,
      cls: "text-violet-600",
    },
    {
      label: "Total Gross",
      value: formatMoney(totals.gross, currency),
      icon: Banknote,
      cls: "text-slate-700",
    },
    {
      label: "Total Deductions",
      value: formatMoney(totals.deductions, currency),
      icon: Banknote,
      cls: "text-rose-600",
    },
    {
      label: "Total Net Paid",
      value: formatMoney(totals.net, currency),
      icon: Banknote,
      cls: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-5">
      {/* header + KPIs */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Payroll Summary</h3>
          <p className="text-xs text-slate-500">
            Company-wide payroll activity, grouped by department
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <k.icon className="h-3.5 w-3.5" /> {k.label}
            </div>
            <p className={cn("mt-1 text-lg font-bold tabular-nums", k.cls)}>
              {k.value}
            </p>
          </div>
        ))}
      </div>
      <p className="-mt-2 text-[11px] text-slate-400">
        Totals cover {hasFilter ? "the filtered runs" : "all payroll runs to date"}.
        The Employee Payroll page's figures cover only the current month, so they
        will differ from this all-history total.
      </p>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarRange className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Pay date
          </span>
        </div>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 px-2.5 text-sm focus:border-violet-400 focus:outline-none"
        />
        <span className="text-slate-400">→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 px-2.5 text-sm focus:border-violet-400 focus:outline-none"
        />
        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-slate-400" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-2.5 text-sm focus:border-violet-400 focus:outline-none"
          >
            <option value="">All departments</option>
            {deptOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, code or department…"
            className="h-9 w-64 rounded-lg border border-slate-200 pl-8 pr-3 text-sm focus:border-violet-400 focus:outline-none"
          />
        </div>
        {hasFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-sm text-slate-500 hover:bg-slate-50"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* body */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          No payroll records{hasFilter ? " for these filters" : " yet"}.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <DepartmentSection
              key={g.department}
              group={g}
              currency={currency}
              isClosed={closed.has(g.department)}
              onToggle={() => toggle(g.department)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PayrollSummaryPanel;
