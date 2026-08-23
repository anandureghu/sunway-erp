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
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  timesheetService,
  type EmployeeMonthlyAttendance,
  type AttendanceHistoryItem,
  type MonthlySummary,
} from "@/service/timesheetService";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import { TablePagination, usePagination } from "@/components/table-pagination";
import { cn, initialsFrom } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { toast } from "sonner";

import { formatPunchTime, parseTimesheetDateTime, resolveCompanyTimezone } from "@/lib/timesheet-time";
import { fetchHrPolicies } from "@/service/companyService";
import { useAuth } from "@/context/AuthContext";

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtTime = (iso: string | null, timeZone: string) =>
  formatPunchTime(iso, timeZone);

const fmtDate = (iso: string, timeZone: string) => {
  const tz = resolveCompanyTimezone(timeZone);
  const d = parseTimesheetDateTime(
    iso.includes("T") ? iso : `${iso}T12:00:00`,
    tz,
  );
  return !d
    ? iso
    : d.toLocaleDateString("en-GB", {
        timeZone: tz,
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
};

const TODAY_META: Record<string, { label: string; cls: string; dot: string }> = {
  PRESENT: {
    label: "Present",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
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
  const { user } = useAuth();
  const companyId = user?.companyId != null ? Number(user.companyId) : null;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  const [rows, setRows] = useState<EmployeeMonthlyAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyTz, setCompanyTz] = useState("Asia/Qatar");

  // Inline overtime editing (no-punch companies only — HR keys the month total).
  const [otEditId, setOtEditId] = useState<number | null>(null);
  const [otDraft, setOtDraft] = useState("");
  const [otSaving, setOtSaving] = useState(false);

  // Drill-down state: the employee whose daily grid is open (null = board).
  const [selected, setSelected] = useState<EmployeeMonthlyAttendance | null>(
    null,
  );
  const [daily, setDaily] = useState<AttendanceHistoryItem[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [drillSummary, setDrillSummary] = useState<MonthlySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monthValue = `${year}-${String(month).padStart(2, "0")}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await timesheetService.getCompanyMonthlySummary(year, month));
    } catch (err) {
      // Distinguish a failed load from a genuinely empty month.
      const message = getApiErrorMessage(err, "Failed to load timesheets");
      console.error("EmployeeTimeSheets -> load failed", err);
      setError(message);
      setRows([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (companyId == null) return;
    let mounted = true;
    fetchHrPolicies(companyId)
      .then((p) => {
        if (mounted) setCompanyTz(resolveCompanyTimezone(p?.timezone));
      })
      .catch(() => {
        if (mounted) setCompanyTz("Asia/Qatar");
      });
    return () => {
      mounted = false;
    };
  }, [companyId]);

  const startEditOt = (r: EmployeeMonthlyAttendance) => {
    setOtEditId(r.employeeId);
    setOtDraft(String(r.overtimeHours ?? 0));
  };
  const cancelEditOt = () => {
    setOtEditId(null);
    setOtDraft("");
  };
  const saveOt = async (r: EmployeeMonthlyAttendance) => {
    const val = Number(otDraft);
    if (!Number.isFinite(val) || val < 0) {
      toast.error("Enter a valid overtime value (hours ≥ 0)");
      return;
    }
    setOtSaving(true);
    try {
      await timesheetService.setOvertimeOverride(r.employeeId, year, month, val);
      toast.success(`Overtime updated for ${r.employeeName || "employee"}`);
      setOtEditId(null);
      setOtDraft("");
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update overtime"));
    } finally {
      setOtSaving(false);
    }
  };

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
      .catch((err) => {
        if (!mounted) return;
        console.error("EmployeeTimeSheets -> daily load failed", err);
        setDaily([]);
        setDrillSummary(null);
        toast.error(getApiErrorMessage(err, "Failed to load daily attendance"));
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
  const totalOvertime = useMemo(
    () => Math.round(rows.reduce((s, r) => s + (r.overtimeHours || 0), 0) * 10) / 10,
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
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[19%]" />
                  <col className="w-[22%]" />
                  <col className="w-[17%]" />
                  <col className="w-[18%]" />
                </colgroup>
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
                          {fmtDate(d.attendanceDate, companyTz)}
                        </td>
                        <td className="py-2.5 tabular-nums text-slate-600">
                          {fmtTime(d.checkInTime, companyTz)}
                        </td>
                        <td className="py-2.5 tabular-nums text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            {fmtTime(d.checkOutTime, companyTz)}
                            {d.autoCheckedOut && (
                              <span
                                title={d.note || "Auto-checkout — employee did not check out."}
                                className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
                              >
                                Auto
                              </span>
                            )}
                          </span>
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
          {
            label: "Total Overtime",
            value: `${totalOvertime} h`,
            hint: "Beyond standard hours",
            accent: "rose",
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
        ) : error ? (
          <div className="py-14 text-center text-sm text-rose-500">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-400">
            {rows.length === 0
              ? "No attendance recorded for this month."
              : "No employees match your search."}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
                      "Regular Hours",
                      "Overtime",
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
                              {initialsFrom(r.employeeName)}
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
                          {fmtTime(r.todayCheckIn, companyTz)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">
                          {fmtTime(r.todayCheckOut, companyTz)}
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
                          {Math.round(
                            Math.max(
                              0,
                              (r.totalHours || 0) - (r.overtimeHours || 0),
                            ) * 10,
                          ) / 10}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-700">
                          {otEditId === r.employeeId ? (
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={otDraft}
                                autoFocus
                                disabled={otSaving}
                                onChange={(e) => setOtDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") void saveOt(r);
                                  if (e.key === "Escape") cancelEditOt();
                                }}
                                className="h-7 w-16 rounded-md border border-slate-300 px-2 text-right text-xs tabular-nums focus:border-violet-400 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => void saveOt(r)}
                                disabled={otSaving}
                                title="Save"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                {otSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditOt}
                                disabled={otSaving}
                                title="Cancel"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : r.editableOvertime ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditOt(r);
                              }}
                              title="Edit overtime hours"
                              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-amber-50"
                            >
                              {r.overtimeHours ? `${r.overtimeHours} h` : "—"}
                              <Pencil className="h-3 w-3 text-slate-400" />
                            </button>
                          ) : r.overtimeHours ? (
                            `${r.overtimeHours} h`
                          ) : (
                            "—"
                          )}
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
