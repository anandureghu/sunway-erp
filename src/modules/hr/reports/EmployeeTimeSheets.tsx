import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  ArrowLeft,
  CalendarClock,
  Clock,
  Users,
  LogIn,
  LogOut,
} from "lucide-react";
import {
  timesheetService,
  type EmployeeMonthlyAttendance,
  type AttendanceHistoryItem,
  type MonthlySummary,
} from "@/service/timesheetService";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { cn } from "@/lib/utils";

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtTime = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
};

const TODAY_META: Record<string, { label: string; cls: string; dot: string }> = {
  CHECKED_IN: {
    label: "Checked in",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  CHECKED_OUT: {
    label: "Checked out",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  NOT_CHECKED_IN: {
    label: "Not in",
    cls: "bg-slate-50 text-slate-500 border-slate-200",
    dot: "bg-slate-300",
  },
};

const DAY_STATUS_META: Record<string, { label: string; cls: string }> = {
  CHECKED_OUT: {
    label: "Complete",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CHECKED_IN: {
    label: "In progress",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  NOT_CHECKED_IN: {
    label: "Absent",
    cls: "bg-slate-50 text-slate-500 border-slate-200",
  },
};

/**
 * HR "Employee Time Sheets" — the live daily board. One row per employee shows
 * their current check-in/out status, hours worked today, and total days worked
 * for the selected month. Click an employee for their daily check-in/out grid.
 * The backend scopes rows: HR sees everyone, a regular employee only themselves.
 */
export default function EmployeeTimeSheets() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  const [rows, setRows] = useState<EmployeeMonthlyAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Drill-down state: the employee whose daily grid is open (null = board).
  const [selected, setSelected] = useState<EmployeeMonthlyAttendance | null>(
    null,
  );
  const [daily, setDaily] = useState<AttendanceHistoryItem[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [drillSummary, setDrillSummary] = useState<MonthlySummary | null>(null);

  const monthValue = `${year}-${String(month).padStart(2, "0")}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await timesheetService.getCompanyMonthlySummary(year, month));
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    let mounted = true;
    setDailyLoading(true);
    Promise.all([
      timesheetService.getDailyHistory(selected.employeeId, year, month),
      timesheetService.getMonthlySummary(selected.employeeId, year, month),
    ])
      .then(([hist, summary]) => {
        if (!mounted) return;
        setDaily(hist);
        setDrillSummary(summary);
      })
      .finally(() => {
        if (mounted) setDailyLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selected, year, month]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.employeeName, r.employeeNo, r.department]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  // Client-side pagination of the (already fully fetched) employee list — the
  // KPIs above the table need every row, so we page the display only.
  const {
    pageItems,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    pageCount,
    total,
  } = usePagination(filtered, 10);

  const checkedInNow = useMemo(
    () => rows.filter((r) => r.todayStatus === "CHECKED_IN").length,
    [rows],
  );
  const checkedOutToday = useMemo(
    () => rows.filter((r) => r.todayStatus === "CHECKED_OUT").length,
    [rows],
  );
  const totalDaysWorked = useMemo(
    () => rows.reduce((s, r) => s + (r.daysPresent || 0), 0),
    [rows],
  );

  const setMonthFromInput = (value: string) => {
    const [y, m] = value.split("-").map(Number);
    if (y && m) {
      setYear(y);
      setMonth(m);
      setSelected(null);
    }
  };

  const MonthPicker = (
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
  );

  // ── DRILL-DOWN: one employee's daily check-in/out ─────────────────────────────
  if (selected) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all employees
          </button>
          {MonthPicker}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {selected.employeeName || "—"}
                {selected.employeeNo && (
                  <span className="ml-2 font-mono text-xs text-slate-400">
                    {selected.employeeNo}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {selected.department || "—"}
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                {drillSummary?.daysPresent ?? selected.daysPresent} days worked
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 font-semibold text-violet-700">
                {drillSummary?.totalHours ?? selected.totalHours} h total
              </span>
            </div>
          </div>

          {dailyLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : daily.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              No attendance recorded this month.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Date", "Check In", "Check Out", "Worked", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {daily.map((d) => {
                    const meta = DAY_STATUS_META[d.status] ?? {
                      label: d.status,
                      cls: "bg-slate-50 text-slate-500 border-slate-200",
                    };
                    return (
                      <tr key={d.attendanceDate} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-medium text-slate-700">
                          {fmtDate(d.attendanceDate)}
                        </td>
                        <td className="py-2.5 tabular-nums text-slate-600">
                          {fmtTime(d.checkInTime)}
                        </td>
                        <td className="py-2.5 tabular-nums text-slate-600">
                          {fmtTime(d.checkOutTime)}
                        </td>
                        <td className="py-2.5 tabular-nums text-slate-600">
                          {d.workedDuration || "—"}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                              meta.cls,
                            )}
                          >
                            {meta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LIVE BOARD: all employees ─────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {MonthPicker}
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee code or name…"
            className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-300/20"
          />
        </div>
      </div>

      <KpiSummaryStrip
        items={[
          {
            label: "Employees",
            value: rows.length,
            hint: "With attendance visibility",
            accent: "violet",
            icon: Users,
          },
          {
            label: "Checked In Now",
            value: checkedInNow,
            hint: "Currently on shift",
            accent: "amber",
            icon: LogIn,
          },
          {
            label: "Checked Out Today",
            value: checkedOutToday,
            hint: "Completed shift today",
            accent: "emerald",
            icon: LogOut,
          },
          {
            label: "Total Days Worked",
            value: totalDaysWorked,
            hint: "This month, all employees",
            accent: "sky",
            icon: Clock,
          },
        ]}
      />

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs text-slate-400">
          {isCurrentMonth
            ? "Live status is for today; days worked / hours are month-to-date. Click an employee for their daily grid."
            : "Viewing a past month — the “today” columns are blank. Days worked / hours are for the selected month."}
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-400">
            {rows.length === 0
              ? "No attendance recorded for this month."
              : "No employees match your search."}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {total} employee{total === 1 ? "" : "s"}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {[
                      "Sl No.",
                      "Employee",
                      "Status Today",
                      "In",
                      "Out",
                      "Hours Today",
                      "Days Worked",
                      "Total Hours",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500",
                          i >= 5 ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r, i) => {
                    const meta =
                      TODAY_META[r.todayStatus] ?? TODAY_META.NOT_CHECKED_IN;
                    return (
                      <tr
                        key={r.employeeId}
                        onClick={() => setSelected(r)}
                        className={cn(
                          "cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/60",
                          i % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                        )}
                      >
                        <td className="px-4 py-3 text-xs tabular-nums text-slate-500">
                          {pageIndex * pageSize + i + 1}
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
                              <p className="text-[10px] font-mono text-slate-400 truncate">
                                {r.employeeNo || `EMP-${r.employeeId}`}
                                {r.department ? ` · ${r.department}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                              meta.cls,
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                meta.dot,
                              )}
                            />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">
                          {fmtTime(r.todayCheckIn)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">
                          {fmtTime(r.todayCheckOut)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                          {r.todayHours ? `${r.todayHours} h` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-50 px-2 text-xs font-bold text-emerald-700">
                            {r.daysPresent}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-800">
                          {r.totalHours}
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
          </div>
        )}
      </div>
    </div>
  );
}
