import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import {
  timesheetService,
  type AttendanceHistoryItem,
  type EmployeeMonthlyAttendance,
  type MonthlySummary,
} from "@/service/timesheetService";
import { publicHolidayService } from "@/service/publicHolidayService";
import { fetchHrPolicies } from "@/service/companyService";
import { useAuth } from "@/context/AuthContext";
import { formatPunchTime, resolveCompanyTimezone } from "@/lib/timesheet-time";
import { cn, initialsFrom } from "@/lib/utils";
import {
  RecordViewDialog,
  DHeaderTag,
  DHighlights,
} from "@/modules/hr/components/record-form-dialog";

type DayKind = "full" | "short" | "restday" | "holiday" | "missing" | "off" | "future";

const KIND_META: Record<DayKind, { label: string; cell: string; dot: string }> = {
  full: {
    label: "Full day",
    cell: "bg-emerald-50 border-emerald-200 text-emerald-800",
    dot: "bg-emerald-500",
  },
  short: {
    label: "Short day",
    cell: "bg-amber-50 border-amber-200 text-amber-800",
    dot: "bg-amber-500",
  },
  restday: {
    label: "Rest-day / holiday work",
    cell: "bg-violet-50 border-violet-200 text-violet-800",
    dot: "bg-violet-500",
  },
  holiday: {
    label: "Public holiday",
    cell: "bg-sky-50 border-sky-200 text-sky-800",
    dot: "bg-sky-500",
  },
  missing: {
    label: "No record",
    cell: "bg-rose-50/70 border-rose-200 text-rose-700",
    dot: "bg-rose-400",
  },
  off: {
    label: "Weekend",
    cell: "bg-slate-50 border-slate-100 text-slate-400",
    dot: "bg-slate-300",
  },
  future: {
    label: "Upcoming",
    cell: "bg-white border-slate-100 text-slate-300",
    dot: "bg-slate-200",
  },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const hrs = (minutes: number) => Math.round((minutes / 60) * 10) / 10;

const shiftMonth = (y: number, m: number, delta: number) => {
  const d = new Date(y, m - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

const monthName = (y: number, m: number, style: "long" | "short" = "long") =>
  new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: style, year: "numeric" });

/**
 * One employee's attendance profile (HR Reports → Attendance History). Unlike the
 * Time Sheets drill-in (a flat daily table), this is a month calendar — every day
 * coloured by what happened — with a day detail strip and a 6-month trend.
 */
export function AttendanceProfileDialog({
  employee,
  initialYear,
  initialMonth,
  onClose,
}: {
  employee: EmployeeMonthlyAttendance | null;
  initialYear: number;
  initialMonth: number;
  onClose: () => void;
}) {
  const { company } = useAuth();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [days, setDays] = useState<AttendanceHistoryItem[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [holidays, setHolidays] = useState<Map<string, string>>(new Map());
  const [trend, setTrend] = useState<{ label: string; days: number; hours: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [tz, setTz] = useState(resolveCompanyTimezone(undefined));
  const [stdHours, setStdHours] = useState(6);
  const [autoCheckout, setAutoCheckout] = useState(10);
  const [picked, setPicked] = useState<string | null>(null);

  // Re-open on the month the report is showing.
  useEffect(() => {
    if (!employee) return;
    setYear(initialYear);
    setMonth(initialMonth);
    setPicked(null);
  }, [employee, initialYear, initialMonth]);

  // Company policy: timezone, standard day, auto check-out (overtime cap).
  useEffect(() => {
    if (!employee || company?.id == null) return;
    fetchHrPolicies(company.id)
      .then((p) => {
        setTz(resolveCompanyTimezone(p?.timezone));
        if (p?.standardWorkingHoursPerDay) setStdHours(Number(p.standardWorkingHoursPerDay));
        if (p?.autoCheckoutAfterHours) setAutoCheckout(Number(p.autoCheckoutAfterHours));
      })
      .catch(() => {});
  }, [employee, company?.id]);

  // The month: daily punches, summary and public holidays.
  useEffect(() => {
    if (!employee) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      timesheetService.getDailyHistory(employee.employeeId, year, month),
      timesheetService.getMonthlySummary(employee.employeeId, year, month),
      publicHolidayService.list(year).catch(() => []),
    ])
      .then(([hist, sum, hols]) => {
        if (!alive) return;
        setDays(hist);
        setSummary(sum);
        const map = new Map<string, string>();
        for (const h of hols) {
          const start = new Date(`${h.startDate}T12:00:00`);
          const end = new Date(`${h.endDate}T12:00:00`);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            map.set(iso(d.getFullYear(), d.getMonth() + 1, d.getDate()), h.name);
          }
        }
        setHolidays(map);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [employee, year, month]);

  // Six months up to the one being viewed.
  useEffect(() => {
    if (!employee) return;
    let alive = true;
    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(year, month, i - 5));
    Promise.all(
      months.map((m) => timesheetService.getMonthlySummary(employee.employeeId, m.year, m.month)),
    ).then((res) => {
      if (!alive) return;
      setTrend(
        months.map((m, i) => ({
          label: new Date(m.year, m.month - 1, 1).toLocaleDateString("en-GB", { month: "short" }),
          days: res[i]?.daysPresent ?? 0,
          hours: res[i]?.totalHours ?? 0,
        })),
      );
    });
    return () => {
      alive = false;
    };
  }, [employee, year, month]);

  const stdMinutes = stdHours * 60;
  const otCapMinutes = Math.max(0, autoCheckout - stdHours) * 60;
  const todayIso = useMemo(() => {
    const t = new Date();
    return iso(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }, []);

  const byDate = useMemo(() => {
    const m = new Map<string, AttendanceHistoryItem>();
    for (const d of days) m.set(d.attendanceDate, d);
    return m;
  }, [days]);

  // Calendar cells + month totals, classified with the payroll rules.
  const { cells, totals } = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const out: ({ date: string; day: number; kind: DayKind; minutes: number } | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) out.push(null);
    const t = { regular: 0, overtime: 0, rest: 0, missing: 0 };
    for (let d = 1; d <= daysInMonth; d++) {
      const date = iso(year, month, d);
      const dow = new Date(year, month - 1, d).getDay();
      const weekend = dow === 5 || dow === 6;
      const holiday = holidays.has(date);
      const rec = byDate.get(date);
      const minutes = rec?.workedMinutes ?? 0;
      let kind: DayKind;
      if (rec?.checkInTime) {
        const regular = Math.min(minutes, stdMinutes);
        const ot = Math.min(Math.max(minutes - stdMinutes, 0), otCapMinutes);
        t.overtime += ot;
        if (weekend || holiday) {
          kind = "restday";
          t.rest += regular;
        } else {
          kind = minutes >= stdMinutes ? "full" : "short";
          t.regular += regular;
        }
      } else if (date > todayIso) {
        kind = "future";
      } else if (holiday && !weekend) {
        kind = "holiday";
      } else if (weekend) {
        kind = "off";
      } else {
        kind = "missing";
        t.missing++;
      }
      out.push({ date, day: d, kind, minutes });
    }
    return { cells: out, totals: t };
  }, [year, month, byDate, holidays, stdMinutes, otCapMinutes, todayIso]);

  const pickedRec = picked ? byDate.get(picked) : undefined;
  const pickedCell = picked ? cells.find((c) => c?.date === picked) : undefined;
  const maxTrend = Math.max(1, ...trend.map((t) => t.days));
  const isCurrentOrFuture = shiftMonth(year, month, 1).year * 12 + shiftMonth(year, month, 1).month >
    new Date().getFullYear() * 12 + new Date().getMonth() + 1;

  const go = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
    setPicked(null);
  };

  return (
    <RecordViewDialog
      open={!!employee}
      onClose={onClose}
      title={employee?.employeeName || "Employee"}
      subtitle={[employee?.employeeNo, employee?.department].filter(Boolean).join(" · ")}
      badge={initialsFrom(employee?.employeeName ?? "")}
      badgeClassName="bg-violet-100 text-violet-700"
      headerExtra={<DHeaderTag>Attendance history</DHeaderTag>}
      maxWidth={820}
    >
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <p className="text-sm font-bold text-slate-800">{monthName(year, month)}</p>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={isCurrentOrFuture}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <DHighlights
        items={[
          { label: "Days worked", value: summary?.daysPresent ?? 0, className: "text-emerald-700" },
          { label: "Regular hours", value: hrs(totals.regular) },
          { label: "Overtime", value: `${hrs(totals.overtime)} h`, className: "text-amber-700" },
          { label: "Rest-day hours", value: `${hrs(totals.rest)} h`, className: "text-violet-700" },
          { label: "No record", value: totals.missing, className: totals.missing ? "text-rose-600" : undefined },
        ]}
      />

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : (
        <>
          {/* Calendar */}
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="mb-1.5 grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((w, i) => (
                <p
                  key={w}
                  className={cn(
                    "text-center text-[10px] font-bold uppercase tracking-wider",
                    i >= 5 ? "text-slate-300" : "text-slate-400",
                  )}
                >
                  {w}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((c, i) =>
                c ? (
                  <button
                    key={c.date}
                    type="button"
                    onClick={() => setPicked(c.date === picked ? null : c.date)}
                    title={
                      holidays.get(c.date) ??
                      (c.minutes ? `${hrs(c.minutes)} h worked` : KIND_META[c.kind].label)
                    }
                    className={cn(
                      "flex h-14 flex-col items-start justify-between rounded-lg border p-1.5 text-left transition",
                      KIND_META[c.kind].cell,
                      picked === c.date && "ring-2 ring-violet-400 ring-offset-1",
                      c.date === todayIso && "outline outline-1 outline-slate-400",
                    )}
                  >
                    <span className="text-[11px] font-bold">{c.day}</span>
                    {c.minutes > 0 && (
                      <span className="text-[10px] font-semibold tabular-nums">
                        {hrs(c.minutes)}h
                      </span>
                    )}
                  </button>
                ) : (
                  <div key={`blank-${i}`} />
                ),
              )}
            </div>
            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {(["full", "short", "restday", "holiday", "missing"] as DayKind[]).map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className={cn("h-2 w-2 rounded-full", KIND_META[k].dot)} />
                  {KIND_META[k].label}
                </span>
              ))}
            </div>
          </div>

          {/* Day detail */}
          {picked && pickedCell && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3 text-sm">
              <p className="font-bold text-slate-800">
                {new Date(`${picked}T12:00:00`).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                })}
              </p>
              {pickedRec?.checkInTime ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <Clock className="h-3.5 w-3.5" />
                    {formatPunchTime(pickedRec.checkInTime, tz)} →{" "}
                    {pickedRec.checkOutTime ? formatPunchTime(pickedRec.checkOutTime, tz) : "still in"}
                    {pickedRec.autoCheckedOut && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 text-[10px] font-semibold text-amber-700">
                        Auto
                      </span>
                    )}
                  </span>
                  <span className="text-slate-600">
                    <b>{hrs(Math.min(pickedCell.minutes, stdMinutes))}h</b>{" "}
                    {pickedCell.kind === "restday" ? "rest-day" : "regular"}
                  </span>
                  <span className="text-amber-700">
                    <b>
                      {hrs(Math.min(Math.max(pickedCell.minutes - stdMinutes, 0), otCapMinutes))}h
                    </b>{" "}
                    overtime
                  </span>
                </>
              ) : (
                <span className="text-slate-500">
                  {holidays.get(picked) ?? KIND_META[pickedCell.kind].label}
                </span>
              )}
            </div>
          )}

          {/* 6-month trend */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Days worked · last 6 months
            </p>
            <div className="flex h-28 items-end gap-3">
              {trend.map((t, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[11px] font-bold tabular-nums text-slate-700">{t.days}</span>
                  <div
                    className={cn(
                      "w-full rounded-t-md",
                      i === trend.length - 1 ? "bg-violet-500" : "bg-violet-200",
                    )}
                    style={{ height: `${Math.max(4, (t.days / maxTrend) * 72)}px` }}
                    title={`${t.days} days · ${t.hours} h`}
                  />
                  <span className="text-[10px] text-slate-400">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </RecordViewDialog>
  );
}
