import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { timesheetService, type TimesheetEntry } from "@/service/timesheetService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LogIn, LogOut, Clock, Calendar, CheckCircle2,
  Timer, Loader2, TrendingUp, Sun, Moon, Coffee,
  MapPin, Zap,
} from "lucide-react";

// ── helpers (unchanged) ───────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatClock(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}


function diffMs(from: string | null | undefined, to?: string | null): number {
  if (!from) return 0;
  const end = to ? new Date(to).getTime() : Date.now();
  return Math.max(0, end - new Date(from).getTime());
}

function msToDuration(ms: number): { h: number; m: number; s: number } {
  const s = Math.floor(ms / 1000);
  return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

function formatDuration(ms: number): string {
  const { h, m } = msToDuration(ms);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatDurationFull(ms: number): string {
  const { h, m, s } = msToDuration(ms);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function totalHoursInMonth(entries: TimesheetEntry[]): number {
  return entries.reduce((sum, e) => {
    if (e.checkInTime && e.checkOutTime) {
      sum += diffMs(e.checkInTime, e.checkOutTime) / 3600000;
    }
    return sum;
  }, 0);
}

function getGreeting(h: number): { label: string; icon: typeof Sun } {
  if (h < 12) return { label: "Good Morning", icon: Sun };
  if (h < 17) return { label: "Good Afternoon", icon: Coffee };
  return { label: "Good Evening", icon: Moon };
}

// ── ElapsedTimer (logic unchanged) ────────────────────────────────────────────

function ElapsedTimer({ checkInTime }: { checkInTime: string }) {
  const [elapsed, setElapsed] = useState(diffMs(checkInTime));
  useEffect(() => {
    const t = setInterval(() => setElapsed(diffMs(checkInTime)), 1000);
    return () => clearInterval(t);
  }, [checkInTime]);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Working for</p>
      <p className="font-mono text-3xl font-bold text-white tabular-nums tracking-tight">
        {formatDurationFull(elapsed)}
      </p>
    </div>
  );
}

// ── NEW: Animated action button ────────────────────────────────────────────────

function ActionButton({
  isCheckedIn, loading, onCheckIn, onCheckOut,
}: {
  isCheckedIn: boolean; loading: boolean;
  onCheckIn: () => void; onCheckOut: () => void;
}) {
  const isCheckOut = isCheckedIn;
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing rings — only when actively checked in */}
      {isCheckOut && !loading && (
        <>
          <span className="absolute inline-flex h-full w-full rounded-full opacity-30 bg-rose-400 animate-ping"
            style={{ animationDuration: "2.4s", animationDelay: "0s" }} />
          <span className="absolute inline-flex rounded-full opacity-20 bg-rose-300 animate-ping"
            style={{ width: "130%", height: "130%", animationDuration: "2.4s", animationDelay: "0.8s" }} />
          <span className="absolute inline-flex rounded-full opacity-10 bg-rose-200 animate-ping"
            style={{ width: "160%", height: "160%", animationDuration: "2.4s", animationDelay: "1.6s" }} />
        </>
      )}
      {!isCheckOut && !loading && (
        <>
          <span className="absolute inline-flex h-full w-full rounded-full opacity-30 bg-emerald-400 animate-ping"
            style={{ animationDuration: "2.4s", animationDelay: "0s" }} />
          <span className="absolute inline-flex rounded-full opacity-20 bg-emerald-300 animate-ping"
            style={{ width: "130%", height: "130%", animationDuration: "2.4s", animationDelay: "0.8s" }} />
        </>
      )}

      <button
        onClick={isCheckOut ? onCheckOut : onCheckIn}
        disabled={loading}
        className={cn(
          "relative z-10 flex flex-col items-center justify-center rounded-full transition-all duration-300 active:scale-95",
          "w-40 h-40 shadow-2xl border-4",
          isCheckOut
            ? "bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 border-rose-300/50 shadow-rose-500/40 hover:shadow-rose-500/60 hover:scale-105"
            : "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 border-emerald-300/50 shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-105",
          loading && "opacity-60 cursor-not-allowed"
        )}
      >
        {loading ? (
          <Loader2 className="h-9 w-9 text-white animate-spin" />
        ) : isCheckOut ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 mb-1">
              <LogOut className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold text-white/90 tracking-widest uppercase">Check Out</span>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 mb-1">
              <LogIn className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold text-white/90 tracking-widest uppercase">Check In</span>
          </>
        )}
      </button>
    </div>
  );
}

// ── NEW: TodayCard ─────────────────────────────────────────────────────────────

function TodayCard({ entry }: { entry: TimesheetEntry | null }) {
  const duration = entry?.checkInTime && entry?.checkOutTime
    ? diffMs(entry.checkInTime, entry.checkOutTime)
    : null;

  const cells = [
    {
      label: "Check In",
      value: formatTime(entry?.checkInTime),
      active: !!entry?.checkInTime,
      icon: LogIn,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
      iconBg: "bg-emerald-500",
    },
    {
      label: "Check Out",
      value: formatTime(entry?.checkOutTime),
      active: !!entry?.checkOutTime,
      icon: LogOut,
      accent: "text-rose-600",
      bg: "bg-rose-50",
      ring: "ring-rose-200",
      iconBg: "bg-rose-500",
    },
    {
      label: "Duration",
      value: duration !== null ? formatDuration(duration) : entry?.checkInTime ? "In Progress" : "—",
      active: duration !== null || !!entry?.checkInTime,
      icon: Timer,
      accent: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-200",
      iconBg: "bg-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cells.map(({ label, value, active, icon: Icon, accent, bg, ring, iconBg }) => (
        <div
          key={label}
          className={cn(
            "rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300",
            active ? cn(bg, "ring-1", ring) : "bg-slate-50 ring-1 ring-slate-100"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</span>
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", active ? iconBg : "bg-slate-200")}>
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <span className={cn("text-2xl font-bold leading-none", active ? accent : "text-slate-300")}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── NEW: MonthStats ────────────────────────────────────────────────────────────

function MonthStats({ entries, monthLabel }: { entries: TimesheetEntry[]; monthLabel: string }) {
  const completed = entries.filter((e) => e.checkInTime && e.checkOutTime);
  const totalH = totalHoursInMonth(entries);
  const avgH = completed.length ? totalH / completed.length : 0;

  const stats = [
    {
      label: "Days Present",
      value: completed.length,
      unit: "days",
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-600",
      light: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      label: "Total Hours",
      value: totalH.toFixed(1),
      unit: "hrs",
      icon: Clock,
      gradient: "from-blue-500 to-indigo-600",
      light: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      label: "Avg Hours / Day",
      value: avgH.toFixed(1),
      unit: "hrs",
      icon: TrendingUp,
      gradient: "from-violet-500 to-purple-600",
      light: "bg-violet-50",
      text: "text-violet-700",
    },
    {
      label: "Days Recorded",
      value: entries.length,
      unit: "days",
      icon: Calendar,
      gradient: "from-amber-500 to-orange-600",
      light: "bg-amber-50",
      text: "text-amber-700",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 px-2">
          <Zap className="h-3 w-3" />
          {monthLabel}
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, unit, icon: Icon, gradient, light, text }) => (
          <div key={label} className={cn("rounded-2xl p-4 flex flex-col gap-3", light)}>
            <div className="flex items-center justify-between">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br", gradient)}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{unit}</span>
            </div>
            <div>
              <p className={cn("text-3xl font-bold leading-none tabular-nums", text)}>{value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NEW: HistoryTable ──────────────────────────────────────────────────────────

function HistoryTable({ entries }: { entries: TimesheetEntry[] }) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Attendance History</h3>
            <p className="text-xs text-slate-400">{entries.length} record{entries.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {entries.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Working
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 ml-2" />
            Complete
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Calendar className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">No attendance records yet</p>
          <p className="text-xs text-slate-300">Records will appear here after your first check-in</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {sorted.map((entry) => {
            const dur = entry.checkInTime && entry.checkOutTime
              ? diffMs(entry.checkInTime, entry.checkOutTime)
              : null;
            const isToday = entry.date === todayStr;
            const isActive = entry.status === "CHECKED_IN";

            return (
              <div
                key={entry.id ?? entry.date}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80",
                  isToday && "bg-indigo-50/40"
                )}
              >
                {/* Date block */}
                <div className={cn(
                  "flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[52px] shrink-0",
                  isToday ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                )}>
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                    {new Date(entry.date).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="text-xl font-black leading-none">
                    {new Date(entry.date).getDate()}
                  </span>
                  <span className="text-[10px] font-semibold opacity-70">
                    {new Date(entry.date).toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-sm font-semibold", isToday ? "text-indigo-700" : "text-slate-800")}>
                      {isToday ? "Today" : new Date(entry.date).toLocaleDateString("en-US", { weekday: "long" })}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>

                  {/* Time row */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <LogIn className="h-3 w-3" />
                      {formatTime(entry.checkInTime)}
                    </span>
                    {entry.checkOutTime ? (
                      <>
                        <span className="text-slate-300">→</span>
                        <span className="flex items-center gap-1 text-rose-500 font-semibold">
                          <LogOut className="h-3 w-3" />
                          {formatTime(entry.checkOutTime)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-300">→</span>
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div className="shrink-0 text-right">
                  {dur !== null ? (
                    <>
                      <p className="text-base font-bold text-slate-800 tabular-nums">{formatDuration(dur)}</p>
                      <p className="text-[10px] text-slate-400 font-medium">duration</p>
                    </>
                  ) : isActive ? (
                    <span className="text-xs font-semibold text-slate-400">ongoing</span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </div>

                {/* Status dot */}
                <div className="shrink-0">
                  {isActive ? (
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component (logic unchanged) ─────────────────────────────────────────

export default function TimesheetTab() {
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const [now, setNow] = useState(new Date());
  const [todayEntry, setTodayEntry] = useState<TimesheetEntry | null>(null);
  const [history, setHistory] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    if (!empId) return;
    setLoading(true);
    try {
      const [today, hist] = await Promise.all([
        timesheetService.getToday(empId),
        timesheetService.getHistory(empId),
      ]);
      setTodayEntry(today);
      if (today && today.checkInTime) {
        const hasToday = hist.some((e) => e.date === today.date);
        setHistory(hasToday ? hist : [today, ...hist]);
      } else {
        setHistory(hist);
      }
    } finally {
      setLoading(false);
    }
  }, [empId]);

  useEffect(() => { void load(); }, [load]);

  const isCheckedIn = !!(todayEntry?.checkInTime && !todayEntry?.checkOutTime);
  const isComplete  = !!(todayEntry?.checkInTime &&  todayEntry?.checkOutTime);

  const handleCheckIn = async () => {
    if (!empId) return;
    setActionLoading(true);
    try {
      const entry = await timesheetService.checkIn(empId);
      setTodayEntry(entry);
      setHistory((prev) => {
        const match = (e: TimesheetEntry) =>
          entry.id != null ? e.id === entry.id : e.date === entry.date;
        const idx = prev.findIndex(match);
        return idx >= 0 ? prev.map((e) => (match(e) ? entry : e)) : [entry, ...prev];
      });
      toast.success("Checked in successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to check in");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!empId) return;
    setActionLoading(true);
    try {
      const entry = await timesheetService.checkOut(empId);
      setTodayEntry(entry);
      setHistory((prev) => {
        const match = (e: TimesheetEntry) =>
          entry.id != null ? e.id === entry.id : e.date === entry.date;
        const idx = prev.findIndex(match);
        return idx >= 0 ? prev.map((e) => (match(e) ? entry : e)) : [entry, ...prev];
      });
      toast.success("Checked out successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to check out");
    } finally {
      setActionLoading(false);
    }
  };

  const currentMonthEntries = useMemo(() => {
    const ym = now.toISOString().slice(0, 7);
    return history.filter((e) => e.date?.slice(0, 7) === ym);
  }, [history, now]);

  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const greeting = getGreeting(now.getHours());
  const GreetIcon = greeting.icon;

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="h-14 w-14 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 h-14 w-14 rounded-full border-4 border-t-indigo-500 animate-spin" />
        </div>
        <p className="text-sm text-slate-400 font-medium">Loading timesheet…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        }}
      >
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.3) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-1/4 h-48 w-48 rounded-full bg-blue-600/15 blur-3xl" />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* ── Left: Clock + Status ── */}
          <div className="flex flex-col justify-center gap-5 px-8 py-10 border-b md:border-b-0 md:border-r border-white/10">
            {/* Greeting */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <GreetIcon className="h-4 w-4 text-yellow-300" />
              </div>
              <span className="text-sm font-semibold text-white/60 tracking-wide">{greeting.label}</span>
            </div>

            {/* Clock */}
            <div>
              <div className="font-mono text-6xl font-black text-white tabular-nums tracking-tighter leading-none">
                {formatClock(now)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-white/40 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5" />
                {now.toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric", year: "numeric",
                })}
              </div>
            </div>

            {/* Status badge */}
            <div>
              {!todayEntry?.checkInTime ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/50 border border-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Not checked in today
                </span>
              ) : isComplete ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm font-semibold text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4" />
                  Shift complete — great work!
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm font-semibold text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Currently working
                </span>
              )}
            </div>

            {/* Completion total */}
            {isComplete && todayEntry?.checkInTime && todayEntry?.checkOutTime && (
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Timer className="h-4 w-4" />
                Total today:
                <span className="text-white font-bold">
                  {formatDuration(diffMs(todayEntry.checkInTime, todayEntry.checkOutTime))}
                </span>
              </div>
            )}
          </div>

          {/* ── Right: Action button + Timer ── */}
          <div className="flex flex-col items-center justify-center gap-6 px-8 py-10">
            {isComplete ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-400/30">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                </div>
                <p className="text-white/40 text-sm text-center">You have completed your shift for today.</p>
              </div>
            ) : (
              <>
                <ActionButton
                  isCheckedIn={isCheckedIn}
                  loading={actionLoading}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                />
                {isCheckedIn && todayEntry?.checkInTime && (
                  <ElapsedTimer checkInTime={todayEntry.checkInTime} />
                )}
                {!isCheckedIn && (
                  <p className="text-white/30 text-xs text-center font-medium tracking-wide">
                    Tap to start your shift
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── TODAY'S SUMMARY ──────────────────────────────────────────────────── */}
      <TodayCard entry={todayEntry} />

      {/* ── MONTHLY STATS ────────────────────────────────────────────────────── */}
      <MonthStats entries={currentMonthEntries} monthLabel={monthLabel} />

      {/* ── ATTENDANCE HISTORY ───────────────────────────────────────────────── */}
      <HistoryTable entries={history} />

    </div>
  );
}
