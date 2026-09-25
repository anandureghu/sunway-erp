import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Award,
  CalendarClock,
  Cake,
  FileClock,
  Hourglass,
  Layers,
  Loader2,
  LogOut,
  Medal,
  PartyPopper,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import {
  employeeReportService,
  fmtReportDate,
  reportStatusMeta,
  type EmployeeReportRow,
} from "@/service/employeeReportService";

/**
 * HR Reports → Workforce Overview. A people-first view of the live workforce:
 * pulse (headcount, joiners, leavers, tenure, age), hires-vs-exits momentum,
 * age & gender pyramid, tenure journey, what's coming up in the next 60 days
 * (anniversaries, birthdays, probation / contract ends, last working days) and
 * the grade ladder. Every person shown can be opened in the Employee Summary.
 */

const EXIT = new Set(["RESIGNED", "TERMINATED", "RETIRED"]);
const DAY = 86_400_000;

const STATUS_ORDER: { key: string; label: string; color: string }[] = [
  { key: "ACTIVE", label: "Active", color: "#34d399" },
  { key: "UNDER_PROBATION", label: "Probation", color: "#fbbf24" },
  { key: "ON_LEAVE", label: "On leave", color: "#38bdf8" },
  { key: "EXITING", label: "Exiting", color: "#fb7185" },
];

const AGE_BANDS: [string, number, number][] = [
  ["Under 25", 0, 24],
  ["25–34", 25, 34],
  ["35–44", 35, 44],
  ["45–54", 45, 54],
  ["55+", 55, 200],
];

const TENURE_STEPS: { label: string; min: number; max: number; color: string }[] = [
  { label: "New", min: 0, max: 1, color: "#f59e0b" },
  { label: "1–3 yrs", min: 1, max: 3, color: "#0ea5e9" },
  { label: "3–5 yrs", min: 3, max: 5, color: "#6366f1" },
  { label: "5–10 yrs", min: 5, max: 10, color: "#8b5cf6" },
  { label: "10+ yrs", min: 10, max: 999, color: "#10b981" },
];

type EventKind = "anniversary" | "birthday" | "probation" | "contract" | "leaving";
const EVENT_META: Record<EventKind, { label: string; icon: typeof Cake; cls: string }> = {
  anniversary: { label: "Work anniversary", icon: Medal, cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  birthday: { label: "Birthday", icon: Cake, cls: "bg-pink-50 text-pink-700 ring-pink-200" },
  probation: { label: "Probation ends", icon: Hourglass, cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  contract: { label: "Contract ends", icon: FileClock, cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  leaving: { label: "Last working day", icon: LogOut, cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

// ── date helpers (local, no UTC shift) ────────────────────────────────────────
const parse = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};
const startOfToday = () => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
};
const ageOf = (dob: Date, on: Date) => {
  let a = on.getFullYear() - dob.getFullYear();
  if (on.getMonth() < dob.getMonth() || (on.getMonth() === dob.getMonth() && on.getDate() < dob.getDate())) a--;
  return a;
};
/** Next occurrence (today or later) of a yearly date. */
const nextYearly = (d: Date, today: Date) => {
  const n = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  return n < today ? new Date(today.getFullYear() + 1, d.getMonth(), d.getDate()) : n;
};
const dayLabel = (d: Date, today: Date) => {
  const diff = Math.round((d.getTime() - today.getTime()) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
};

export default function WorkforceOverview({
  onOpenEmployee,
}: {
  onOpenEmployee: (id: number) => void;
}) {
  const [rows, setRows] = useState<EmployeeReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<EventKind | "all">("all");

  useEffect(() => {
    let cancelled = false;
    employeeReportService
      .register()
      .then((r) => !cancelled && setRows(r.rows))
      .catch((err) => toast.error(getApiErrorMessage(err, "Could not load workforce data.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo(startOfToday, []);
  const status = (r: EmployeeReportRow) => String(r.status ?? "").toUpperCase();

  // Current workforce = everyone still on the books (not INACTIVE).
  const current = useMemo(() => rows.filter((r) => status(r) !== "INACTIVE"), [rows]);

  // ── pulse ───────────────────────────────────────────────────────────────────
  const pulse = useMemo(() => {
    const year = today.getFullYear();
    const joinedThisYear = rows.filter((r) => parse(r.joinDate)?.getFullYear() === year).length;
    const leaving = current.filter((r) => EXIT.has(status(r))).length;
    const leftThisYear = rows.filter(
      (r) => status(r) === "INACTIVE" && parse(r.expectedEndDate)?.getFullYear() === year,
    ).length;
    const tenures = current.map((r) => r.yearsOfService).filter((v): v is number => v != null);
    const ages = current
      .map((r) => parse(r.dateOfBirth))
      .filter((d): d is Date => !!d)
      .map((d) => ageOf(d, today));
    const male = current.filter((r) => (r.gender ?? "").toLowerCase().startsWith("m")).length;
    const female = current.filter((r) => (r.gender ?? "").toLowerCase().startsWith("f")).length;
    const statusCounts = STATUS_ORDER.map((s) => ({
      ...s,
      value:
        s.key === "EXITING"
          ? leaving
          : current.filter((r) => status(r) === s.key).length,
    }));
    return {
      headcount: current.length,
      joinedThisYear,
      leaving,
      leftThisYear,
      net: joinedThisYear - leftThisYear,
      avgTenure: tenures.length ? tenures.reduce((a, b) => a + b, 0) / tenures.length : null,
      avgAge: ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : null,
      male,
      female,
      statusCounts,
    };
  }, [rows, current, today]);

  // ── hires vs exits, last 12 months ──────────────────────────────────────────
  const momentum = useMemo(() => {
    const months: { key: string; label: string; hires: number; exits: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-GB", { month: "short" }) + (d.getMonth() === 0 ? ` ${String(d.getFullYear()).slice(2)}` : ""),
        hires: 0,
        exits: 0,
      });
    }
    const idx = new Map(months.map((m, i) => [m.key, i]));
    rows.forEach((r) => {
      const j = parse(r.joinDate);
      if (j) {
        const i = idx.get(`${j.getFullYear()}-${j.getMonth()}`);
        if (i != null) months[i].hires++;
      }
      const st = status(r);
      const e = parse(r.expectedEndDate);
      if (e && (EXIT.has(st) || st === "INACTIVE") && e <= today) {
        const i = idx.get(`${e.getFullYear()}-${e.getMonth()}`);
        if (i != null) months[i].exits--; // negative → drawn below the axis
      }
    });
    return months;
  }, [rows, today]);
  const momentumTotals = useMemo(
    () => ({
      hires: momentum.reduce((a, m) => a + m.hires, 0),
      exits: -momentum.reduce((a, m) => a + m.exits, 0),
    }),
    [momentum],
  );

  // ── age & gender pyramid ────────────────────────────────────────────────────
  const pyramid = useMemo(() => {
    const data = AGE_BANDS.map(([label]) => ({ band: label, male: 0, female: 0, other: 0 }));
    let unknown = 0;
    current.forEach((r) => {
      const dob = parse(r.dateOfBirth);
      if (!dob) {
        unknown++;
        return;
      }
      const a = ageOf(dob, today);
      const i = AGE_BANDS.findIndex(([, lo, hi]) => a >= lo && a <= hi);
      if (i < 0) return;
      const g = (r.gender ?? "").toLowerCase();
      if (g.startsWith("m")) data[i].male--; // left side
      else if (g.startsWith("f")) data[i].female++;
      else data[i].other++;
    });
    return { data: [...data].reverse(), unknown };
  }, [current, today]);
  const pyramidMax = Math.max(
    1,
    ...pyramid.data.map((d) => Math.max(-d.male, d.female + d.other)),
  );

  // ── tenure journey ──────────────────────────────────────────────────────────
  const tenure = useMemo(() => {
    const steps = TENURE_STEPS.map((s) => ({
      ...s,
      people: current.filter(
        (r) => (r.yearsOfService ?? 0) >= s.min && (r.yearsOfService ?? 0) < s.max,
      ),
    }));
    const veterans = [...current]
      .filter((r) => r.yearsOfService != null)
      .sort((a, b) => (b.yearsOfService ?? 0) - (a.yearsOfService ?? 0))
      .slice(0, 3);
    return { steps, veterans };
  }, [current]);

  // ── coming up (next 60 days) ────────────────────────────────────────────────
  const events = useMemo(() => {
    const horizon = new Date(today.getTime() + 60 * DAY);
    const list: { kind: EventKind; date: Date; row: EmployeeReportRow; detail: string }[] = [];
    current.forEach((r) => {
      const join = parse(r.joinDate);
      if (join) {
        const next = nextYearly(join, today);
        const years = next.getFullYear() - join.getFullYear();
        if (years >= 1 && next <= horizon)
          list.push({ kind: "anniversary", date: next, row: r, detail: `${years} ${years === 1 ? "year" : "years"} with the company` });
      }
      const dob = parse(r.dateOfBirth);
      if (dob) {
        const next = nextYearly(dob, today);
        if (next <= new Date(today.getTime() + 30 * DAY))
          list.push({ kind: "birthday", date: next, row: r, detail: `Turns ${next.getFullYear() - dob.getFullYear()}` });
      }
      const prob = parse(r.probationEndDate);
      if (prob && status(r) === "UNDER_PROBATION" && prob >= today && prob <= horizon)
        list.push({ kind: "probation", date: prob, row: r, detail: "Confirmation decision due" });
      const cEnd = parse(r.contractEndDate);
      if (cEnd && !EXIT.has(status(r)) && cEnd >= today && cEnd <= horizon)
        list.push({ kind: "contract", date: cEnd, row: r, detail: "Renew or close the contract" });
      const last = parse(r.expectedEndDate);
      if (last && EXIT.has(status(r)) && last >= today && last <= horizon)
        list.push({ kind: "leaving", date: last, row: r, detail: reportStatusMeta(r.status).label });
    });
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [current, today]);
  const eventCounts = useMemo(() => {
    const c: Record<string, number> = {};
    events.forEach((e) => (c[e.kind] = (c[e.kind] ?? 0) + 1));
    return c;
  }, [events]);
  const shownEvents = events.filter((e) => eventFilter === "all" || e.kind === eventFilter);

  // ── grade ladder ────────────────────────────────────────────────────────────
  const grades = useMemo(() => {
    const m = new Map<string, number>();
    current.forEach((r) => {
      const g = r.gradeCode?.trim() || "No grade";
      m.set(g, (m.get(g) ?? 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) =>
      a[0] === "No grade" ? 1 : b[0] === "No grade" ? -1 : b[0].localeCompare(a[0], undefined, { numeric: true }),
    );
  }, [current]);
  const gradeMax = Math.max(1, ...grades.map(([, n]) => n));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-semibold text-slate-700">No employees yet</p>
        <p className="text-sm text-slate-400">Add employees to see your workforce overview.</p>
      </div>
    );
  }

  const genderTotal = pulse.male + pulse.female;

  return (
    <div className="space-y-5">
      {/* ═════════ Pulse hero ═════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-900 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
              <Activity className="h-3.5 w-3.5" /> Workforce pulse
            </p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-6xl font-black leading-none tracking-tight sm:text-7xl">
                {pulse.headcount}
              </span>
              <span className="pb-2 text-sm text-indigo-200">people on the team today</span>
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm">
              {pulse.net >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-300" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-300" />
              )}
              <span className={pulse.net >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {pulse.net >= 0 ? "+" : ""}
                {pulse.net} net
              </span>
              <span className="text-indigo-200">
                this year · {pulse.joinedThisYear} joined, {pulse.leftThisYear} left
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat icon={<UserPlus className="h-4 w-4" />} label="Joined this year" value={pulse.joinedThisYear} tone="text-emerald-300" />
            <HeroStat icon={<LogOut className="h-4 w-4" />} label="Leaving" value={pulse.leaving} tone="text-rose-300" />
            <HeroStat
              icon={<Award className="h-4 w-4" />}
              label="Avg tenure"
              value={pulse.avgTenure != null ? pulse.avgTenure.toFixed(1) : "—"}
              unit="yrs"
              tone="text-violet-200"
            />
            <HeroStat
              icon={<Sparkles className="h-4 w-4" />}
              label="Avg age"
              value={pulse.avgAge != null ? Math.round(pulse.avgAge) : "—"}
              unit="yrs"
              tone="text-sky-200"
            />
          </div>
        </div>

        {/* status ribbon */}
        <div className="relative mt-7">
          <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
            {pulse.statusCounts.map((s) =>
              s.value > 0 ? (
                <div
                  key={s.key}
                  title={`${s.label}: ${s.value}`}
                  className="h-full transition-all duration-700"
                  style={{ width: `${(s.value / Math.max(pulse.headcount, 1)) * 100}%`, background: s.color }}
                />
              ) : null,
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-indigo-100">
            {pulse.statusCounts.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label} <b className="font-semibold text-white">{s.value}</b>
              </span>
            ))}
            {genderTotal > 0 && (
              <span className="ml-auto inline-flex items-center gap-2">
                <span className="text-indigo-200">Gender</span>
                <span className="flex h-2 w-24 overflow-hidden rounded-full bg-white/10">
                  <span className="h-full bg-sky-400" style={{ width: `${(pulse.male / genderTotal) * 100}%` }} />
                  <span className="h-full bg-pink-400" style={{ width: `${(pulse.female / genderTotal) * 100}%` }} />
                </span>
                <span>
                  <b className="text-sky-300">{Math.round((pulse.male / genderTotal) * 100)}%</b> M ·{" "}
                  <b className="text-pink-300">{Math.round((pulse.female / genderTotal) * 100)}%</b> F
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═════════ Momentum + pyramid ═════════ */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card
          className="xl:col-span-3"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="from-emerald-500 to-teal-600"
          title="Hiring momentum"
          subtitle="Joiners vs leavers — last 12 months"
          right={
            <div className="flex gap-3 text-xs">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                +{momentumTotals.hires} hired
              </span>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">
                −{momentumTotals.exits} left
              </span>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={momentum} stackOffset="sign" margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => String(Math.abs(v))}
              />
              <ReferenceLine y={0} stroke="#cbd5e1" />
              <Tooltip
                cursor={{ fill: "rgba(99,102,241,0.06)" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1 font-semibold text-slate-800">{label}</p>
                      <p className="text-emerald-600">Joined: {payload.find((p) => p.dataKey === "hires")?.value ?? 0}</p>
                      <p className="text-rose-600">Left: {Math.abs(Number(payload.find((p) => p.dataKey === "exits")?.value ?? 0))}</p>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="hires" stackId="m" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="exits" stackId="m" fill="#fb7185" radius={[0, 0, 6, 6]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card
          className="xl:col-span-2"
          icon={<Users className="h-4 w-4" />}
          accent="from-sky-500 to-pink-500"
          title="Age & gender"
          subtitle="Population pyramid of the current team"
          right={
            <div className="flex gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-sky-700">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Male
              </span>
              <span className="inline-flex items-center gap-1 text-pink-700">
                <span className="h-2 w-2 rounded-full bg-pink-500" /> Female
              </span>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pyramid.data} layout="vertical" stackOffset="sign" margin={{ top: 4, right: 12, left: 4, bottom: 0 }} barCategoryGap={8}>
              <XAxis
                type="number"
                domain={[-pyramidMax, pyramidMax]}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => String(Math.abs(v))}
                axisLine={false}
                tickLine={false}
              />
              <YAxis type="category" dataKey="band" tick={{ fontSize: 11, fill: "#64748b" }} width={62} axisLine={false} tickLine={false} />
              <ReferenceLine x={0} stroke="#cbd5e1" />
              <Tooltip
                cursor={{ fill: "rgba(99,102,241,0.06)" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1 font-semibold text-slate-800">Age {label}</p>
                      <p className="text-sky-600">Male: {Math.abs(Number(payload.find((p) => p.dataKey === "male")?.value ?? 0))}</p>
                      <p className="text-pink-600">Female: {payload.find((p) => p.dataKey === "female")?.value ?? 0}</p>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="male" stackId="g" fill="#0ea5e9" radius={[6, 0, 0, 6]} />
              <Bar dataKey="female" stackId="g" fill="#ec4899" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {pyramid.unknown > 0 && (
            <p className="mt-1 text-[11px] text-slate-400">
              {pyramid.unknown} employee{pyramid.unknown === 1 ? "" : "s"} without a date of birth not shown.
            </p>
          )}
        </Card>
      </div>

      {/* ═════════ Coming up + tenure ═════════ */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card
          className="xl:col-span-3"
          icon={<CalendarClock className="h-4 w-4" />}
          accent="from-violet-600 to-fuchsia-500"
          title="Coming up"
          subtitle="Next 60 days — birthdays within 30"
        >
          <div className="mb-3 flex flex-wrap gap-1.5">
            <Chip active={eventFilter === "all"} onClick={() => setEventFilter("all")}>
              All <b>{events.length}</b>
            </Chip>
            {(Object.keys(EVENT_META) as EventKind[]).map((k) => {
              const M = EVENT_META[k];
              return (
                <Chip key={k} active={eventFilter === k} onClick={() => setEventFilter(k)}>
                  <M.icon className="h-3 w-3" /> {M.label} <b>{eventCounts[k] ?? 0}</b>
                </Chip>
              );
            })}
          </div>
          {shownEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <PartyPopper className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">Nothing on the calendar for this filter.</p>
            </div>
          ) : (
            <ol className="relative max-h-[360px] space-y-1 overflow-y-auto pr-1">
              {shownEvents.map((ev, i) => {
                const M = EVENT_META[ev.kind];
                return (
                  <li key={`${ev.kind}-${ev.row.id}-${i}`}>
                    <button
                      type="button"
                      onClick={() => onOpenEmployee(ev.row.id)}
                      className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="w-14 shrink-0 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {ev.date.toLocaleDateString("en-GB", { month: "short" })}
                        </p>
                        <p className="text-xl font-black leading-none text-slate-800">{ev.date.getDate()}</p>
                      </div>
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1", M.cls)}>
                        <M.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-indigo-700">
                          {ev.row.fullName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {M.label} · {ev.detail}
                          {ev.row.departmentName ? ` · ${ev.row.departmentName}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {dayLabel(ev.date, today)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <Card
          className="xl:col-span-2"
          icon={<Medal className="h-4 w-4" />}
          accent="from-amber-500 to-orange-500"
          title="Tenure journey"
          subtitle="Where the team sits on the service path"
        >
          {/* journey track */}
          <div className="relative px-1 pb-2 pt-3">
            <div className="absolute left-6 right-6 top-[34px] h-1 rounded-full bg-gradient-to-r from-amber-300 via-indigo-300 to-emerald-300" />
            <div className="relative flex justify-between">
              {tenure.steps.map((s) => {
                const size = 28 + Math.min(s.people.length, 20) * 1.6;
                return (
                  <div key={s.label} className="flex w-16 flex-col items-center">
                    <div className="flex h-[62px] items-center">
                      <div
                        className="flex items-center justify-center rounded-full font-bold text-white shadow-md ring-4 ring-white"
                        style={{ width: size, height: size, background: s.color }}
                        title={`${s.people.length} people · ${s.label}`}
                      >
                        {s.people.length}
                      </div>
                    </div>
                    <p className="mt-1 text-center text-[11px] font-semibold text-slate-600">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Longest serving
          </p>
          <div className="space-y-2">
            {tenure.veterans.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onOpenEmployee(v.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-gradient-to-r from-amber-50/70 to-white px-3 py-2 text-left transition-shadow hover:shadow-sm"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white",
                    i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : "bg-orange-400",
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{v.fullName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[v.designation, `since ${fmtReportDate(v.joinDate)}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-black leading-none text-amber-600">
                    {v.yearsOfService?.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-400">years</span>
                </span>
              </button>
            ))}
            {tenure.veterans.length === 0 && (
              <p className="text-sm text-slate-400">No join dates recorded yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* ═════════ Grade ladder ═════════ */}
      {grades.length > 0 && (
        <Card
          icon={<Layers className="h-4 w-4" />}
          accent="from-indigo-500 to-blue-600"
          title="Grade ladder"
          subtitle="Headcount at each salary grade, top grade first"
        >
          <div className="flex items-end gap-2 overflow-x-auto pb-1 pt-4">
            {grades.map(([g, n], i) => (
              <div key={g} className="flex min-w-[64px] flex-1 flex-col items-center">
                <span className="mb-1 text-sm font-bold text-slate-800">{n}</span>
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-indigo-600 to-violet-400 transition-all duration-700"
                  style={{
                    height: `${24 + (n / gradeMax) * 120}px`,
                    opacity: g === "No grade" ? 0.35 : 1 - Math.min(i, 6) * 0.08,
                  }}
                />
                <span className="mt-1.5 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                  {g}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function HeroStat({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  unit?: string;
  tone: string;
}) {
  return (
    <div className="min-w-[120px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <p className={cn("flex items-center gap-1.5 text-[11px] font-medium", tone)}>
        {icon} {label}
      </p>
      <p className="mt-1 text-2xl font-bold">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-indigo-200">{unit}</span>}
      </p>
    </div>
  );
}

function Card({
  icon,
  accent,
  title,
  subtitle,
  right,
  className,
  children,
}: {
  icon: ReactNode;
  accent: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-3xl border border-slate-100 bg-white p-5 shadow-sm", className)}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", accent)}>
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors [&_b]:font-bold",
        active
          ? "border-violet-600 bg-violet-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700",
      )}
    >
      {children}
    </button>
  );
}
