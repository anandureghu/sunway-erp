import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, LogOut, CheckCircle2, FileText } from "lucide-react";
import {
  exitInterviewService,
  type ExitInterviewSummary,
} from "@/service/exitInterviewService";
import { useEmployeeSelection } from "@/context/employee-selection";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { cn, initialsFrom } from "@/lib/utils";

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/**
 * Company-wide list of exit / termination interviews. Row click opens that
 * employee's exit-interview form (read/edit). Gated server-side by the
 * EMPLOYEE_PROFILE view-all grant, so only managers/HR reach this tab.
 */
export function ExitInterviewsPanel() {
  const navigate = useNavigate();
  const { setSelected } = useEmployeeSelection();

  const [rows, setRows] = useState<ExitInterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUBMITTED" | "DRAFT">(
    "ALL",
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    exitInterviewService
      .list()
      .then((data) => mounted && setRows(data))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && (r.status ?? "").toUpperCase() !== statusFilter)
        return false;
      if (!q) return true;
      return [r.employeeName, r.employeeNo, r.department, r.separationType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, statusFilter]);

  const {
    pageItems,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    pageCount,
    total,
  } = usePagination(filtered, 10);

  const submittedCount = useMemo(
    () => rows.filter((r) => (r.status ?? "").toUpperCase() === "SUBMITTED").length,
    [rows],
  );

  const openForm = (r: ExitInterviewSummary) => {
    const name = r.employeeName ?? "";
    const [first, ...rest] = name.split(" ");
    // Seed the employee-selection context so the employee shell renders and the
    // sidebar's Exit Interview tab shows — status is the EMPLOYEE's exit status.
    setSelected({
      id: String(r.employeeId),
      employeeNo: r.employeeNo ?? "",
      no: r.employeeNo ?? "",
      name,
      firstName: first ?? "",
      lastName: rest.join(" "),
      status: r.employeeStatus ?? "TERMINATED",
      department: r.department ?? undefined,
      designation: r.designation ?? undefined,
    } as any);
    navigate(`/hr/employees/${r.employeeId}/exit-interview`, {
      state: { fromReports: true },
    });
  };

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
            <LogOut className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Exit / Termination Forms</h3>
            <p className="text-[11px] text-slate-500">
              {submittedCount} submitted · {rows.length} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            {(["ALL", "SUBMITTED", "DRAFT"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors",
                  statusFilter === s
                    ? "bg-violet-600 text-white"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {s.toLowerCase()}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee or type…"
              className="h-9 w-56 rounded-lg border border-slate-300 pl-8 pr-3 text-sm focus:border-violet-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-2 h-8 w-8 text-slate-200" />
            <p className="text-sm text-slate-400">No exit interviews found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {[
                      "Employee",
                      "Department",
                      "Separation",
                      "Last Working Day",
                      "Status",
                      "Updated",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500",
                          i >= 3 ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r, i) => {
                    const submitted = (r.status ?? "").toUpperCase() === "SUBMITTED";
                    return (
                      <tr
                        key={r.employeeId}
                        onClick={() => openForm(r)}
                        className={cn(
                          "cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/60",
                          i % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-xs font-bold text-white">
                              {initialsFrom(r.employeeName ?? "")}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800">
                                {r.employeeName || "—"}
                              </p>
                              <p className="truncate font-mono text-[10px] text-slate-400">
                                {r.employeeNo || `EMP-${r.employeeId}`}
                                {r.designation ? ` · ${r.designation}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.department || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.separationType || "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                          {fmtDate(r.lastWorkingDay)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                              submitted
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700",
                            )}
                          >
                            {submitted ? <CheckCircle2 className="h-3 w-3" /> : null}
                            {submitted ? "Submitted" : "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                          {fmtDate(r.submittedAt ?? r.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
          </>
        )}
      </div>
    </div>
  );
}

export default ExitInterviewsPanel;
