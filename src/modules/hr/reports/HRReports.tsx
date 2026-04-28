import { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, UserCheck, UserX, Clock, TrendingUp, Calendar,
  Globe, Building2, Award, Loader2, RefreshCw, BarChart3,
  ArrowUpRight, Briefcase,
} from "lucide-react";
import { hrService } from "@/service/hr.service";
import { leavePolicyService } from "@/service/leavePolicyService";
import { appraisalService } from "@/service/appraisalService";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/hr";

// ── colour palette ────────────────────────────────────────────────────────────
const COLORS = {
  blue:    "#3b82f6",
  indigo:  "#6366f1",
  violet:  "#8b5cf6",
  emerald: "#10b981",
  amber:   "#f59e0b",
  rose:    "#f43f5e",
  slate:   "#64748b",
  sky:     "#0ea5e9",
  teal:    "#14b8a6",
  pink:    "#ec4899",
};
const PALETTE = Object.values(COLORS);

const STATUS_COLOR: Record<string, string> = {
  Active:    COLORS.emerald,
  Inactive:  COLORS.slate,
  "On Leave": COLORS.amber,
};

// ── helpers ───────────────────────────────────────────────────────────────────
function countBy<T>(arr: T[], key: (item: T) => string): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  arr.forEach((item) => {
    const k = key(item) || "Unknown";
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function isWithinDays(dateStr: string | undefined, days: number): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (now.getTime() - d.getTime()) / 86400000 <= days;
}

// ── sub-components ────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string; trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-start gap-4">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {trend && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 mt-1">
            <ArrowUpRight className="h-3 w-3" />{trend}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, label, color = "text-blue-600" }: { icon: React.ElementType; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={cn("h-4 w-4", color)} />
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">{label}</h3>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function HBar({ label, value, total, color = "#6366f1" }: { label: string; value: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-700 font-medium truncate max-w-[160px]">{label}</span>
        <span className="text-slate-500 tabular-nums text-xs">{value} <span className="text-slate-400">({pct}%)</span></span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const CUSTOM_TOOLTIP = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-slate-800">{payload[0].name}</p>
      <p className="text-slate-600">{payload[0].value}</p>
    </div>
  );
};

// ── tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "workforce", label: "Workforce", icon: Users },
  { id: "leaves",    label: "Leave Policy", icon: Calendar },
  { id: "appraisal", label: "Performance", icon: Award },
] as const;
type TabId = (typeof TABS)[number]["id"];

// ── main component ────────────────────────────────────────────────────────────
export default function HRReports() {
  const { company } = useAuth();
  const [tab, setTab] = useState<TabId>("workforce");

  // ── data state ──────────────────────────────────────────────────────────────
  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes]   = useState<string[]>([]);
  const [appraisals, setAppraisals]   = useState<any[]>([]);
  const [appraisalYear, setAppraisalYear] = useState(new Date().getFullYear());

  const [loadingEmp,   setLoadingEmp]   = useState(true);
  const [loadingLeave, setLoadingLeave] = useState(true);
  const [loadingAppr,  setLoadingAppr]  = useState(false);

  // ── fetch employees ─────────────────────────────────────────────────────────
  const fetchEmployees = async () => {
    setLoadingEmp(true);
    try { setEmployees(await hrService.listEmployees()); }
    catch { setEmployees([]); }
    finally { setLoadingEmp(false); }
  };

  // ── fetch leave data ────────────────────────────────────────────────────────
  const fetchLeaveData = async () => {
    if (!company?.id) return;
    setLoadingLeave(true);
    try {
      const [policies, types] = await Promise.all([
        leavePolicyService.getPolicies(company.id).then((r) => r.data || []),
        leavePolicyService.getLeaveTypes(company.id).then((r) => r.data?.map((lt: any) => lt.name) || []),
      ]);
      setLeavePolicies(policies);
      setLeaveTypes(types);
    } catch { setLeavePolicies([]); setLeaveTypes([]); }
    finally { setLoadingLeave(false); }
  };

  // ── fetch appraisals ────────────────────────────────────────────────────────
  const fetchAppraisals = async () => {
    setLoadingAppr(true);
    try {
      const res = await appraisalService.listByYear(appraisalYear, 0, 200);
      setAppraisals(res?.content || []);
    } catch { setAppraisals([]); }
    finally { setLoadingAppr(false); }
  };

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { fetchLeaveData(); }, [company?.id]);
  useEffect(() => { if (tab === "appraisal") fetchAppraisals(); }, [tab, appraisalYear]);

  // ── workforce analytics ─────────────────────────────────────────────────────
  const statusData    = useMemo(() => countBy(employees, (e) => e.status || "Unknown"),           [employees]);
  const genderData    = useMemo(() => countBy(employees, (e) => e.gender || "Unknown"),            [employees]);
  const deptData      = useMemo(() => countBy(employees, (e) => e.department || "Unassigned").slice(0, 8), [employees]);
  const nationalityData = useMemo(() => countBy(employees, (e) => e.nationality || "Unknown").slice(0, 6), [employees]);
  const roleData      = useMemo(() => countBy(employees, (e) => e.companyRole || e.designation || "Unknown").slice(0, 6), [employees]);
  const newHires      = useMemo(() => employees.filter((e) => isWithinDays(e.joinDate, 30)),       [employees]);

  const activeCount   = employees.filter((e) => e.status === "Active").length;
  const inactiveCount = employees.filter((e) => e.status === "Inactive").length;
  const onLeaveCount  = employees.filter((e) => e.status === "On Leave").length;

  // ── leave analytics ─────────────────────────────────────────────────────────
  const uniqueRoles = useMemo(() => [...new Set(leavePolicies.map((p) => p.role))], [leavePolicies]);

  const policyMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    leavePolicies.forEach((p) => {
      if (!matrix[p.role]) matrix[p.role] = {};
      matrix[p.role][p.leaveType] = p.defaultDays ?? p.daysAllowed ?? 0;
    });
    return matrix;
  }, [leavePolicies]);

  // ── appraisal analytics ─────────────────────────────────────────────────────
  const appraisalStatusData = useMemo(() => countBy(appraisals, (a) => a.status || "Unknown"), [appraisals]);

  const APPR_STATUS_COLOR: Record<string, string> = {
    LOCKED:           COLORS.emerald,
    MANAGER_REVIEWED: COLORS.blue,
    SELF_SUBMITTED:   COLORS.amber,
    draft:            COLORS.slate,
  };

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 p-5 bg-slate-50/60 min-h-screen">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 py-6 shadow-lg">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">HR Reports & Analytics</h1>
              <p className="text-xs text-blue-100 mt-0.5">
                {company?.companyName} · {employees.length} employees
              </p>
            </div>
          </div>
          <button
            onClick={() => { fetchEmployees(); fetchLeaveData(); }}
            className="inline-flex items-center gap-2 rounded-lg bg-white/15 border border-white/25 px-4 py-2 text-sm font-medium text-white hover:bg-white/25 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              tab === id
                ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── WORKFORCE TAB ── */}
      {tab === "workforce" && (
        loadingEmp ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Total Employees"  value={employees.length} icon={Users}     color="bg-gradient-to-br from-violet-500 to-indigo-600" />
              <StatCard label="Active"           value={activeCount}      icon={UserCheck}  color="bg-gradient-to-br from-emerald-500 to-teal-600"  sub={`${employees.length ? Math.round((activeCount/employees.length)*100) : 0}% of total`} />
              <StatCard label="Inactive"         value={inactiveCount}    icon={UserX}      color="bg-gradient-to-br from-slate-400 to-slate-600"    />
              <StatCard label="On Leave"         value={onLeaveCount}     icon={Clock}      color="bg-gradient-to-br from-amber-500 to-orange-600"   />
              <StatCard label="New Hires (30d)"  value={newHires.length}  icon={TrendingUp} color="bg-gradient-to-br from-blue-500 to-sky-600"       trend={newHires.length > 0 ? `+${newHires.length} this month` : undefined} />
            </div>

            {/* Row 1: Status pie + Gender bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Status distribution */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle icon={Users} label="Employee Status" color="text-violet-600" />
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLOR[entry.name] || COLORS.slate} />
                        ))}
                      </Pie>
                      <Tooltip content={<CUSTOM_TOOLTIP />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5">
                    {statusData.map((s) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[s.name] || COLORS.slate }} />
                        <span className="text-sm text-slate-700 flex-1">{s.name}</span>
                        <span className="text-sm font-bold text-slate-800 tabular-nums">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gender distribution */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle icon={Users} label="Gender Distribution" color="text-blue-600" />
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                        {genderData.map((entry, i) => (
                          <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CUSTOM_TOOLTIP />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5">
                    {genderData.map((g, i) => (
                      <div key={g.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                        <span className="text-sm text-slate-700 flex-1">{g.name}</span>
                        <span className="text-sm font-bold text-slate-800 tabular-nums">{g.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Department bar chart */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <SectionTitle icon={Building2} label="Employees by Department" color="text-indigo-600" />
              {deptData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No department data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptData} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} width={120} />
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                    <Bar dataKey="value" name="Employees" radius={[0, 6, 6, 0]}>
                      {deptData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Row 3: Nationality + Role distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Nationality */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle icon={Globe} label="Top Nationalities" color="text-sky-600" />
                {nationalityData.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No nationality data</p>
                ) : (
                  <div className="space-y-3">
                    {nationalityData.map((n, i) => (
                      <HBar key={n.name} label={n.name} value={n.value} total={employees.length} color={PALETTE[i % PALETTE.length]} />
                    ))}
                  </div>
                )}
              </div>

              {/* Role distribution */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle icon={Briefcase} label="Role Distribution" color="text-violet-600" />
                {roleData.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No role data</p>
                ) : (
                  <div className="space-y-3">
                    {roleData.map((r, i) => (
                      <HBar key={r.name} label={r.name} value={r.value} total={employees.length} color={PALETTE[(i + 4) % PALETTE.length]} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* New hires table */}
            {newHires.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle icon={TrendingUp} label="Recent Hires (Last 30 Days)" color="text-emerald-600" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Join Date</th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {newHires.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-medium text-slate-800">
                            {e.firstName} {e.lastName}
                          </td>
                          <td className="py-2.5 text-slate-500">{e.department || "—"}</td>
                          <td className="py-2.5 text-slate-500">{e.companyRole || e.designation || "—"}</td>
                          <td className="py-2.5 text-slate-500 tabular-nums">
                            {e.joinDate ? new Date(e.joinDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-2.5">
                            <span className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              e.status === "Active"   ? "bg-emerald-50 text-emerald-700"
                              : e.status === "On Leave" ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                            )}>
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ── LEAVE POLICY TAB ── */}
      {tab === "leaves" && (
        loadingLeave ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* Leave type summary cards */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <SectionTitle icon={Calendar} label="Configured Leave Types" color="text-blue-600" />
              {leaveTypes.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No leave types configured.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {leaveTypes.map((lt, i) => (
                    <span
                      key={lt}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                      style={{
                        backgroundColor: `${PALETTE[i % PALETTE.length]}15`,
                        borderColor: `${PALETTE[i % PALETTE.length]}40`,
                        color: PALETTE[i % PALETTE.length],
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                      {lt}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Policy matrix */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm overflow-x-auto">
              <SectionTitle icon={Users} label="Leave Entitlement Matrix (Days per Year)" color="text-violet-600" />
              {uniqueRoles.length === 0 || leaveTypes.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No leave policies configured yet.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="py-2.5 px-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-50 rounded-l-lg border border-slate-100 min-w-[140px]">
                        Role
                      </th>
                      {leaveTypes.map((lt, i) => (
                        <th key={lt} className="py-2.5 px-3 text-center text-xs font-bold uppercase tracking-wide bg-slate-50 border border-slate-100"
                          style={{ color: PALETTE[i % PALETTE.length] }}
                        >
                          {lt}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-center text-xs font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50 rounded-r-lg border border-emerald-100">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {uniqueRoles.map((role) => {
                      const rowTotal = leaveTypes.reduce((sum, lt) => sum + (policyMatrix[role]?.[lt] ?? 0), 0);
                      return (
                        <tr key={role} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-700 border-b border-slate-50">
                            {role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </td>
                          {leaveTypes.map((lt, i) => {
                            const days = policyMatrix[role]?.[lt] ?? 0;
                            return (
                              <td key={lt} className="py-2.5 px-3 text-center border-b border-slate-50">
                                <span className={cn(
                                  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold mx-auto",
                                  days > 0
                                    ? "text-white"
                                    : "bg-slate-50 text-slate-300 border border-slate-100"
                                )}
                                style={days > 0 ? {
                                  backgroundColor: `${PALETTE[i % PALETTE.length]}20`,
                                  color: PALETTE[i % PALETTE.length],
                                  border: `1px solid ${PALETTE[i % PALETTE.length]}40`,
                                } : {}}
                                >
                                  {days > 0 ? days : "—"}
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-3 text-center border-b border-slate-50">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700 border border-emerald-100 mx-auto">
                              {rowTotal}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Days by leave type bar chart */}
            {leavePolicies.length > 0 && leaveTypes.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle icon={BarChart3} label="Average Entitlement by Leave Type" color="text-indigo-600" />
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={leaveTypes.map((lt, i) => {
                      const values = uniqueRoles.map((r) => policyMatrix[r]?.[lt] ?? 0).filter((v) => v > 0);
                      return {
                        name: lt,
                        avg: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0,
                        max: values.length ? Math.max(...values) : 0,
                        fill: PALETTE[i % PALETTE.length],
                      };
                    })}
                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                    <Legend />
                    <Bar dataKey="avg" name="Avg Days" radius={[6, 6, 0, 0]}>
                      {leaveTypes.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )
      )}

      {/* ── APPRAISAL / PERFORMANCE TAB ── */}
      {tab === "appraisal" && (
        <div className="space-y-5">

          {/* Year selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">Year:</span>
            {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((y) => (
              <button
                key={y}
                onClick={() => setAppraisalYear(y)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all",
                  appraisalYear === y
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {y}
              </button>
            ))}
          </div>

          {loadingAppr ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Appraisals"   value={appraisals.length}  icon={Award}    color="bg-gradient-to-br from-violet-500 to-indigo-600" />
                <StatCard label="Completed"          value={appraisals.filter((a) => a.status === "LOCKED").length} icon={UserCheck} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
                <StatCard label="In Progress"        value={appraisals.filter((a) => ["SELF_SUBMITTED","MANAGER_REVIEWED"].includes(a.status)).length} icon={Clock} color="bg-gradient-to-br from-blue-500 to-sky-600" />
                <StatCard label="Draft"              value={appraisals.filter((a) => a.status === "draft").length} icon={UserX} color="bg-gradient-to-br from-slate-400 to-slate-500" />
              </div>

              {appraisals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 rounded-2xl border border-slate-100 bg-white shadow-sm gap-3">
                  <Award className="h-12 w-12 text-slate-200" />
                  <p className="text-slate-400 font-medium">No appraisals found for {appraisalYear}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Status pie */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <SectionTitle icon={Award} label="Appraisal Status Breakdown" color="text-violet-600" />
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={200}>
                        <PieChart>
                          <Pie data={appraisalStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48}>
                            {appraisalStatusData.map((entry) => (
                              <Cell key={entry.name} fill={APPR_STATUS_COLOR[entry.name] || COLORS.slate} />
                            ))}
                          </Pie>
                          <Tooltip content={<CUSTOM_TOOLTIP />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-3">
                        {appraisalStatusData.map((s) => (
                          <div key={s.name} className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: APPR_STATUS_COLOR[s.name] || COLORS.slate }} />
                            <span className="text-xs text-slate-600 flex-1 capitalize">{s.name.replace(/_/g, " ").toLowerCase()}</span>
                            <span className="text-sm font-bold text-slate-800 tabular-nums">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Completion rate */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <SectionTitle icon={TrendingUp} label="Completion Rate" color="text-emerald-600" />
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                      {(() => {
                        const completed = appraisals.filter((a) => a.status === "LOCKED").length;
                        const pct = appraisals.length > 0 ? Math.round((completed / appraisals.length) * 100) : 0;
                        return (
                          <>
                            <div className="relative h-28 w-28">
                              <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="2.5"
                                  strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round"
                                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-slate-800">{pct}%</span>
                                <span className="text-[10px] text-slate-400 font-medium">complete</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">{completed} of {appraisals.length} appraisals finalised</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
