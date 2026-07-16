import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  CalendarClock,
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import {
  timesheetService,
  type EmployeeMonthlyAttendance,
} from "@/service/timesheetService";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

/**
 * HR "Attendance History" — pick a month and (optionally) an employee code to
 * see how many days each employee worked in that period. Pages are fetched from
 * the server. Once a month is archived the persistent snapshot is served (with
 * a lock badge); otherwise the live figures are shown so a month can be reviewed
 * before archiving.
 */
export default function AttendanceHistory() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [code, setCode] = useState("");
  const [codeQuery, setCodeQuery] = useState("");
  const [page, setPage] = useState(0);

  const [rows, setRows] = useState<EmployeeMonthlyAttendance[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [archived, setArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const monthValue = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  // Debounce the employee-code input so we don't fetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setCodeQuery(code), 350);
    return () => clearTimeout(t);
  }, [code]);

  // Reset to the first page whenever the filter changes.
  useEffect(() => {
    setPage(0);
  }, [year, month, codeQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await timesheetService.getMonthlyHistoryPage(
        year,
        month,
        codeQuery,
        page,
        PAGE_SIZE,
      );
      setRows(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(Math.max(res.totalPages, 1));
      setArchived(res.archived);
    } finally {
      setLoading(false);
    }
  }, [year, month, codeQuery, page]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const setMonthFromInput = (value: string) => {
    const [y, m] = value.split("-").map(Number);
    if (y && m) {
      setYear(y);
      setMonth(m);
    }
  };

  const handleArchive = async () => {
    if (busy) return;
    if (
      !window.confirm(
        `Archive ${monthLabel}? This snapshots every employee's worked days for the month.`,
      )
    )
      return;
    setBusy(true);
    try {
      const res = await timesheetService.archiveMonth(year, month);
      toast.success(`Archived ${monthLabel} (${res.archivedCount} employees)`);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to archive month",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleUnarchive = async () => {
    if (busy) return;
    if (!window.confirm(`Unarchive ${monthLabel}? This removes the saved snapshot.`))
      return;
    setBusy(true);
    try {
      await timesheetService.unarchiveMonth(year, month);
      toast.success(`Unarchived ${monthLabel}`);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to unarchive month",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters + archive action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 text-violet-500" />
            <span className="font-semibold text-slate-600">Month</span>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => setMonthFromInput(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-300/20"
            />
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Employee code…"
              className="h-9 w-48 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-300/20"
            />
          </div>
        </div>

        {archived ? (
          <button
            onClick={handleUnarchive}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
          >
            <ArchiveRestore className="h-4 w-4" />
            Unarchive {monthLabel}
          </button>
        ) : (
          <button
            onClick={handleArchive}
            disabled={busy || totalElements === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60"
          >
            <Archive className="h-4 w-4" />
            Archive {monthLabel}
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            Days worked per employee for {monthLabel}.
          </p>
          {archived && (
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
              <Lock className="h-3 w-3" />
              Archived snapshot
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-400">
            {codeQuery
              ? "No employees match that code."
              : "No attendance for this month."}
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {totalElements} employee{totalElements === 1 ? "" : "s"}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {[
                        "Sl No.",
                        "Employee",
                        "Department",
                        "Days Worked",
                        "Days Recorded",
                        "Total Hours",
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
                    {rows.map((r, i) => (
                      <tr
                        key={r.employeeId}
                        className={cn(
                          "border-b border-slate-100 transition-colors hover:bg-slate-50/60",
                          i % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                        )}
                      >
                        <td className="px-4 py-3 text-xs tabular-nums text-slate-500">
                          {page * PAGE_SIZE + i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-white text-xs font-bold shadow-sm">
                              {(r.employeeName?.[0] ?? "?").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">
                                {r.employeeName || "—"}
                              </p>
                              {r.employeeNo && (
                                <p className="text-[10px] font-mono text-slate-400 truncate">
                                  {r.employeeNo}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {r.department || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-50 px-2 text-xs font-bold text-emerald-700">
                            {r.daysPresent}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                          {r.daysRecorded}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-800">
                          {r.totalHours}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Server-side pagination */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-xs text-slate-400">
                {totalElements} employee{totalElements === 1 ? "" : "s"} · page{" "}
                {page + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
