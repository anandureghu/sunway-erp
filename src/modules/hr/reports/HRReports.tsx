import { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  Globe,
  Building2,
  Award,
  Loader2,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  Briefcase,
  ShieldAlert,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Search,
  Wallet,
  Banknote,
  FileText,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { hrService } from "@/service/hr.service";
import { appraisalService } from "@/service/appraisalService";
import { leaveService } from "@/service/leaveService";
import { loanService } from "@/service/loanService";
import { formatMoney } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { canView } from "@/service/companyService";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/hr";
import { PageHeader } from "@/components/PageHeader";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import ImmigrationExpiryReport from "./ImmigrationExpiryReport";
import { HistoryTabPanel } from "@/modules/shared/history-tab-panel";

// ── colour palette ────────────────────────────────────────────────────────────
const COLORS = {
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  slate: "#64748b",
  sky: "#0ea5e9",
  teal: "#14b8a6",
  pink: "#ec4899",
};
const PALETTE = Object.values(COLORS);

const STATUS_COLOR: Record<string, string> = {
  Active: COLORS.emerald,
  Inactive: COLORS.slate,
  "On Leave": COLORS.amber,
};

// ── helpers ───────────────────────────────────────────────────────────────────
function countBy<T>(
  arr: T[],
  key: (item: T) => string,
): { name: string; value: number }[] {
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
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-start gap-4">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          color,
        )}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {trend && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 mt-1">
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
  color = "text-blue-600",
}: {
  icon: React.ElementType;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={cn("h-4 w-4", color)} />
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
        {label}
      </h3>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function HBar({
  label,
  value,
  total,
  color = "#6366f1",
}: {
  label: string;
  value: number;
  total: number;
  color?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-700 font-medium truncate max-w-[160px]">
          {label}
        </span>
        <span className="text-slate-500 tabular-nums text-xs">
          {value} <span className="text-slate-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
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
// Workforce analytics require the HR_REPORTS grant; the Immigration Expiry tab
// is gated separately by IMMIGRATION so an employee with only their own
// immigration view still reaches it (and the backend scopes the rows).
const ANALYTICS_TABS = [
  { id: "workforce", label: "Workforce Overview", icon: Users },
  { id: "department", label: "Department Headcount", icon: Building2 },
  { id: "breakdown", label: "Workforce Breakdown", icon: Globe },
  { id: "appraisal", label: "Performance", icon: Award },
] as const;
// Leave Approvals is gated by the LEAVES grant (approvers / HR / admin).
const LEAVES_TAB = {
  id: "leaves",
  label: "Leave Approvals",
  icon: CalendarCheck,
} as const;
// Loan Approvals is gated by the LOANS grant.
const LOANS_TAB = {
  id: "loans",
  label: "Loan Approvals",
  icon: Wallet,
} as const;
const IMMIGRATION_TAB = {
  id: "immigration",
  label: "Immigration Expiry",
  icon: ShieldAlert,
} as const;
const HISTORY_TAB = {
  id: "history",
  label: "History",
  icon: FileText,
} as const;
type TabId =
  | "workforce"
  | "department"
  | "breakdown"
  | "appraisal"
  | "leaves"
  | "loans"
  | "immigration"
  | "history";
const ALL_TAB_IDS: TabId[] = [
  "workforce",
  "department",
  "breakdown",
  "appraisal",
  "leaves",
  "loans",
  "immigration",
  "history",
];

// One decided leave row from the company-wide approvals history.
type LeaveApprovalRow = {
  id: number;
  employeeName: string;
  leaveCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  dateReported: string;
  returnDate: string;
  totalDays: number;
  leaveStatus: string; // APPROVED | COMPLETED | REJECTED
};

const LEAVE_STATUS_META: Record<
  string,
  { label: string; cls: string; icon: React.ElementType }
> = {
  APPROVED: {
    label: "Approved",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Completed",
    cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: CalendarCheck,
  },
  REJECTED: {
    label: "Rejected",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
};

const fmtDay = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

// One decided loan row from the company-wide approvals history.
type LoanApprovalRow = {
  id: number;
  loanCode: string;
  loanType: string;
  loanAmount: number;
  monthlyDeduction: number;
  balance: number;
  status: string; // ACTIVE | CLOSED | REJECTED
  startDate: string;
  endDate: string;
  employeeName: string;
  currencySymbol?: string;
};

const LOAN_STATUS_META: Record<
  string,
  { label: string; cls: string; icon: React.ElementType }
> = {
  ACTIVE: {
    label: "Active",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  CLOSED: {
    label: "Closed",
    cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Banknote,
  },
  REJECTED: {
    label: "Rejected",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
};

const humanizeLoan = (t?: string) =>
  (t ?? "—").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ── main component ────────────────────────────────────────────────────────────
export default function HRReports() {
  const { company, permissions } = useAuth();
  const [searchParams] = useSearchParams();

  const canHrReports = canView(permissions, "HR_REPORTS");
  const canImmigration = canView(permissions, "IMMIGRATION");
  const canLeaves = canView(permissions, "LEAVES");
  const canLoans = canView(permissions, "LOANS");

  const visibleTabs = useMemo(() => {
    const tabs: Array<{ id: TabId; label: string; icon: React.ElementType }> =
      [];
    if (canHrReports) tabs.push(...ANALYTICS_TABS);
    if (canLeaves) tabs.push(LEAVES_TAB);
    if (canLoans) tabs.push(LOANS_TAB);
    if (canImmigration) tabs.push(IMMIGRATION_TAB);
    tabs.push(HISTORY_TAB);
    return tabs;
  }, [canHrReports, canLeaves, canLoans, canImmigration]);

  const requestedTab = searchParams.get("tab") as TabId | null;
  const [tab, setTab] = useState<TabId>(
    requestedTab && ALL_TAB_IDS.includes(requestedTab)
      ? requestedTab
      : "workforce",
  );

  // Keep the active tab within the set the user is allowed to see (e.g. an
  // employee with only IMMIGRATION lands directly on the Immigration tab).
  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.some((t) => t.id === tab)) {
      setTab(visibleTabs[0].id);
    }
  }, [visibleTabs, tab]);

  // ── data state ──────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [appraisalYear, setAppraisalYear] = useState(new Date().getFullYear());

  const [loadingEmp, setLoadingEmp] = useState(true);
  const [loadingAppr, setLoadingAppr] = useState(false);

  const [leaveApprovals, setLeaveApprovals] = useState<LeaveApprovalRow[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [leaveSearch, setLeaveSearch] = useState("");

  const [loanApprovals, setLoanApprovals] = useState<LoanApprovalRow[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loanSearch, setLoanSearch] = useState("");

  // ── fetch employees ─────────────────────────────────────────────────────────
  const fetchEmployees = async () => {
    setLoadingEmp(true);
    try {
      setEmployees(await hrService.listEmployees());
    } catch {
      setEmployees([]);
    } finally {
      setLoadingEmp(false);
    }
  };

  // ── fetch appraisals ────────────────────────────────────────────────────────
  const fetchAppraisals = async () => {
    setLoadingAppr(true);
    try {
      const res = await appraisalService.listByYear(appraisalYear, 0, 200);
      setAppraisals(res?.content || []);
    } catch {
      setAppraisals([]);
    } finally {
      setLoadingAppr(false);
    }
  };

  useEffect(() => {
    // Only pull the company-wide employee list for users who can see the
    // workforce analytics; an immigration-only viewer skips it.
    if (canHrReports) fetchEmployees();
    else setLoadingEmp(false);
  }, [canHrReports]);
  useEffect(() => {
    if (tab === "appraisal") fetchAppraisals();
  }, [tab, appraisalYear]);

  // ── fetch leave approvals ─────────────────────────────────────────────────────
  const fetchLeaveApprovals = async () => {
    setLoadingLeaves(true);
    try {
      const res = await leaveService.fetchLeaveApprovalsHistory();
      setLeaveApprovals(
        res.success ? ((res.data as LeaveApprovalRow[]) ?? []) : [],
      );
    } catch {
      setLeaveApprovals([]);
    } finally {
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    if (tab === "leaves") fetchLeaveApprovals();
  }, [tab]);

  // ── fetch loan approvals ──────────────────────────────────────────────────────
  const fetchLoanApprovals = async () => {
    setLoadingLoans(true);
    try {
      const res = await loanService.fetchLoanApprovalsHistory();
      setLoanApprovals((res.data as LoanApprovalRow[]) ?? []);
    } catch {
      setLoanApprovals([]);
    } finally {
      setLoadingLoans(false);
    }
  };

  useEffect(() => {
    if (tab === "loans") fetchLoanApprovals();
  }, [tab]);

  // ── workforce analytics ─────────────────────────────────────────────────────
  const statusData = useMemo(
    () => countBy(employees, (e) => e.status || "Unknown"),
    [employees],
  );
  const genderData = useMemo(
    () => countBy(employees, (e) => e.gender || "Unknown"),
    [employees],
  );
  const deptData = useMemo(
    () => countBy(employees, (e) => e.department || "Unassigned").slice(0, 8),
    [employees],
  );
  const nationalityData = useMemo(
    () => countBy(employees, (e) => e.nationality || "Unknown").slice(0, 6),
    [employees],
  );
  const roleData = useMemo(
    () =>
      countBy(
        employees,
        (e) => e.companyRole || e.designation || "Unknown",
      ).slice(0, 6),
    [employees],
  );
  const newHires = useMemo(
    () => employees.filter((e) => isWithinDays(e.joinDate, 30)),
    [employees],
  );

  const activeCount = employees.filter((e) => e.status === "Active").length;
  const inactiveCount = employees.filter((e) => e.status === "Inactive").length;
  const onLeaveCount = employees.filter((e) => e.status === "On Leave").length;

  // ── appraisal analytics ─────────────────────────────────────────────────────
  const appraisalStatusData = useMemo(
    () => countBy(appraisals, (a) => a.status || "Unknown"),
    [appraisals],
  );

  const APPR_STATUS_COLOR: Record<string, string> = {
    LOCKED: COLORS.emerald,
    MANAGER_REVIEWED: COLORS.blue,
    SELF_SUBMITTED: COLORS.amber,
    draft: COLORS.slate,
  };

  // ── leave-approval analytics ──────────────────────────────────────────────────
  const leaveApprovedCount = leaveApprovals.filter(
    (l) => l.leaveStatus === "APPROVED",
  ).length;
  const leaveCompletedCount = leaveApprovals.filter(
    (l) => l.leaveStatus === "COMPLETED",
  ).length;
  const leaveRejectedCount = leaveApprovals.filter(
    (l) => l.leaveStatus === "REJECTED",
  ).length;
  // "Approvals done" = leaves that were approved (still active) or completed.
  const leaveApprovalsDone = leaveApprovedCount + leaveCompletedCount;
  const leaveDaysApproved = leaveApprovals
    .filter(
      (l) => l.leaveStatus === "APPROVED" || l.leaveStatus === "COMPLETED",
    )
    .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);
  const filteredLeaves = leaveSearch.trim()
    ? leaveApprovals.filter((l) =>
        [l.employeeName, l.leaveType, l.leaveStatus, l.leaveCode]
          .join(" ")
          .toLowerCase()
          .includes(leaveSearch.toLowerCase()),
      )
    : leaveApprovals;

  // ── loan-approval analytics ───────────────────────────────────────────────────
  const loanActiveCount = loanApprovals.filter(
    (l) => l.status === "ACTIVE",
  ).length;
  const loanClosedCount = loanApprovals.filter(
    (l) => l.status === "CLOSED",
  ).length;
  const loanRejectedCount = loanApprovals.filter(
    (l) => l.status === "REJECTED",
  ).length;
  // "Approvals done" = loans that were approved (active) or fully repaid (closed).
  const loanApprovalsDone = loanActiveCount + loanClosedCount;
  const loanAmountApproved = loanApprovals
    .filter((l) => l.status === "ACTIVE" || l.status === "CLOSED")
    .reduce((sum, l) => sum + (Number(l.loanAmount) || 0), 0);
  const loanCurrency = loanApprovals[0]?.currencySymbol || "$";
  const filteredLoans = loanSearch.trim()
    ? loanApprovals.filter((l) =>
        [l.employeeName, l.loanType, l.status, l.loanCode]
          .join(" ")
          .toLowerCase()
          .includes(loanSearch.toLowerCase()),
      )
    : loanApprovals;

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 p-6 bg-slate-50/60 min-h-screen">
      {/* Header */}

      <PageHeader
        title="HR Reports & Analytics"
        description={
          canHrReports
            ? `${company?.companyName} · ${employees.length} employees`
            : `${company?.companyName ?? ""}`
        }
        variant="default"
        icon={<BarChart3 className="w-6 h-6" />}
        actions={
          <button
            onClick={() => {
              fetchEmployees();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-white/15 border border-white/25 px-4 py-2 text-sm font-medium text-white hover:bg-white/25 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        }
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
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
      {tab === "workforce" &&
        (loadingEmp ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* KPI cards */}
            <div className="mb-6">
              <KpiSummaryStrip
                className="lg:grid-cols-5"
                items={[
                  {
                    label: "Total Employees",
                    value: employees.length,
                    hint: "Total workforce",
                    accent: "violet",
                    icon: Users,
                  },
                  {
                    label: "Active",
                    value: activeCount,
                    hint: `${employees.length ? Math.round((activeCount / employees.length) * 100) : 0}% of total`,
                    accent: "emerald",
                    icon: UserCheck,
                  },
                  {
                    label: "Inactive",
                    value: inactiveCount,
                    hint: "Former employees",
                    accent: "slate",
                    icon: UserX,
                  },
                  {
                    label: "On Leave",
                    value: onLeaveCount,
                    hint: "Currently away",
                    accent: "amber",
                    icon: Clock,
                  },
                  {
                    label: "New Hires (30d)",
                    value: newHires.length,
                    hint: newHires.length > 0 ? `+${newHires.length} this month` : "No recent hires",
                    accent: "sky",
                    icon: TrendingUp,
                  },
                ]}
              />
            </div>

            {/* Row 1: Status pie + Gender bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Status distribution */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={Users}
                  label="Employee Status"
                  color="text-violet-600"
                />
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                      >
                        {statusData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLOR[entry.name] || COLORS.slate}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CUSTOM_TOOLTIP />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5">
                    {statusData.map((s) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              STATUS_COLOR[s.name] || COLORS.slate,
                          }}
                        />
                        <span className="text-sm text-slate-700 flex-1">
                          {s.name}
                        </span>
                        <span className="text-sm font-bold text-slate-800 tabular-nums">
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gender distribution */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={Users}
                  label="Gender Distribution"
                  color="text-blue-600"
                />
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                      >
                        {genderData.map((entry, i) => (
                          <Cell
                            key={entry.name}
                            fill={PALETTE[i % PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CUSTOM_TOOLTIP />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5">
                    {genderData.map((g, i) => (
                      <div key={g.name} className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: PALETTE[i % PALETTE.length],
                          }}
                        />
                        <span className="text-sm text-slate-700 flex-1">
                          {g.name}
                        </span>
                        <span className="text-sm font-bold text-slate-800 tabular-nums">
                          {g.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* New hires table */}
            {newHires.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={TrendingUp}
                  label="Recent Hires (Last 30 Days)"
                  color="text-emerald-600"
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Name
                        </th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Department
                        </th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Role
                        </th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Join Date
                        </th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {newHires.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-medium text-slate-800">
                            {e.firstName} {e.lastName}
                          </td>
                          <td className="py-2.5 text-slate-500">
                            {e.department || "—"}
                          </td>
                          <td className="py-2.5 text-slate-500">
                            {e.companyRole || e.designation || "—"}
                          </td>
                          <td className="py-2.5 text-slate-500 tabular-nums">
                            {e.joinDate
                              ? new Date(e.joinDate).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                e.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : e.status === "On Leave"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600",
                              )}
                            >
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
        ))}

      {/* ── DEPARTMENT HEADCOUNT TAB ── */}
      {tab === "department" &&
        (loadingEmp ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="mb-6">
              <KpiSummaryStrip
                items={[
                  {
                    label: "Total Employees",
                    value: employees.length,
                    hint: "Total workforce",
                    accent: "violet",
                    icon: Users,
                  },
                  {
                    label: "Departments",
                    value: deptData.length,
                    hint: "Active departments",
                    accent: "sky",
                    icon: Building2,
                  },
                  {
                    label: "Active",
                    value: employees.filter((e) => e.status === "Active").length,
                    hint: "Currently active",
                    accent: "emerald",
                    icon: UserCheck,
                  },
                  {
                    label: "On Leave",
                    value: employees.filter((e) => e.status === "On Leave").length,
                    hint: "Currently away",
                    accent: "amber",
                    icon: Clock,
                  },
                ]}
              />
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <SectionTitle
                icon={Building2}
                label="Headcount by Department"
                color="text-indigo-600"
              />
              {deptData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-12">
                  No department data available
                </p>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(260, deptData.length * 42)}
                >
                  <BarChart
                    data={deptData}
                    layout="vertical"
                    margin={{ left: 16, right: 40, top: 4, bottom: 4 }}
                  >
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      width={130}
                    />
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                    <Bar dataKey="value" name="Employees" radius={[0, 8, 8, 0]}>
                      {deptData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {deptData.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={Building2}
                  label="Department Breakdown"
                  color="text-violet-600"
                />
                <div className="space-y-3">
                  {deptData.map((d, i) => (
                    <HBar
                      key={d.name}
                      label={d.name}
                      value={d.value}
                      total={employees.length}
                      color={PALETTE[i % PALETTE.length]}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

      {/* ── WORKFORCE BREAKDOWN TAB ── */}
      {tab === "breakdown" &&
        (loadingEmp ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={Users}
                  label="Employee Status"
                  color="text-violet-600"
                />
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                      >
                        {statusData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLOR[entry.name] || COLORS.slate}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CUSTOM_TOOLTIP />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5">
                    {statusData.map((s) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              STATUS_COLOR[s.name] || COLORS.slate,
                          }}
                        />
                        <span className="text-sm text-slate-700 flex-1">
                          {s.name}
                        </span>
                        <span className="text-sm font-bold text-slate-800 tabular-nums">
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={Users}
                  label="Gender Distribution"
                  color="text-blue-600"
                />
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                      >
                        {genderData.map((entry, i) => (
                          <Cell
                            key={entry.name}
                            fill={PALETTE[i % PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CUSTOM_TOOLTIP />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2.5">
                    {genderData.map((g, i) => (
                      <div key={g.name} className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: PALETTE[i % PALETTE.length],
                          }}
                        />
                        <span className="text-sm text-slate-700 flex-1">
                          {g.name}
                        </span>
                        <span className="text-sm font-bold text-slate-800 tabular-nums">
                          {g.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={Globe}
                  label="Top Nationalities"
                  color="text-sky-600"
                />
                {nationalityData.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    No nationality data
                  </p>
                ) : (
                  <div className="space-y-3">
                    {nationalityData.map((n, i) => (
                      <HBar
                        key={n.name}
                        label={n.name}
                        value={n.value}
                        total={employees.length}
                        color={PALETTE[i % PALETTE.length]}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <SectionTitle
                  icon={Briefcase}
                  label="Role Distribution"
                  color="text-violet-600"
                />
                {roleData.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    No role data
                  </p>
                ) : (
                  <div className="space-y-3">
                    {roleData.map((r, i) => (
                      <HBar
                        key={r.name}
                        label={r.name}
                        value={r.value}
                        total={employees.length}
                        color={PALETTE[(i + 4) % PALETTE.length]}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

      {/* ── APPRAISAL / PERFORMANCE TAB ── */}
      {tab === "appraisal" && (
        <div className="space-y-5">
          {/* Year selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">Year:</span>
            {[
              new Date().getFullYear(),
              new Date().getFullYear() - 1,
              new Date().getFullYear() - 2,
            ].map((y) => (
              <button
                key={y}
                onClick={() => setAppraisalYear(y)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all",
                  appraisalYear === y
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
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
                <StatCard
                  label="Total Appraisals"
                  value={appraisals.length}
                  icon={Award}
                  color="bg-gradient-to-br from-violet-500 to-indigo-600"
                />
                <StatCard
                  label="Completed"
                  value={appraisals.filter((a) => a.status === "LOCKED").length}
                  icon={UserCheck}
                  color="bg-gradient-to-br from-emerald-500 to-teal-600"
                />
                <StatCard
                  label="In Progress"
                  value={
                    appraisals.filter((a) =>
                      ["SELF_SUBMITTED", "MANAGER_REVIEWED"].includes(a.status),
                    ).length
                  }
                  icon={Clock}
                  color="bg-gradient-to-br from-blue-500 to-sky-600"
                />
                <StatCard
                  label="Draft"
                  value={appraisals.filter((a) => a.status === "draft").length}
                  icon={UserX}
                  color="bg-gradient-to-br from-slate-400 to-slate-500"
                />
              </div>

              {appraisals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 rounded-2xl border border-slate-100 bg-white shadow-sm gap-3">
                  <Award className="h-12 w-12 text-slate-200" />
                  <p className="text-slate-400 font-medium">
                    No appraisals found for {appraisalYear}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Status pie */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <SectionTitle
                      icon={Award}
                      label="Appraisal Status Breakdown"
                      color="text-violet-600"
                    />
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={200}>
                        <PieChart>
                          <Pie
                            data={appraisalStatusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            innerRadius={48}
                          >
                            {appraisalStatusData.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={
                                  APPR_STATUS_COLOR[entry.name] || COLORS.slate
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CUSTOM_TOOLTIP />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-3">
                        {appraisalStatusData.map((s) => (
                          <div key={s.name} className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  APPR_STATUS_COLOR[s.name] || COLORS.slate,
                              }}
                            />
                            <span className="text-xs text-slate-600 flex-1 capitalize">
                              {s.name.replace(/_/g, " ").toLowerCase()}
                            </span>
                            <span className="text-sm font-bold text-slate-800 tabular-nums">
                              {s.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Completion rate */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <SectionTitle
                      icon={TrendingUp}
                      label="Completion Rate"
                      color="text-emerald-600"
                    />
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                      {(() => {
                        const completed = appraisals.filter(
                          (a) => a.status === "LOCKED",
                        ).length;
                        const pct =
                          appraisals.length > 0
                            ? Math.round((completed / appraisals.length) * 100)
                            : 0;
                        return (
                          <>
                            <div className="relative h-28 w-28">
                              <svg
                                viewBox="0 0 36 36"
                                className="h-28 w-28 -rotate-90"
                              >
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="15.9"
                                  fill="none"
                                  stroke="#f1f5f9"
                                  strokeWidth="2.5"
                                />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="15.9"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="2.5"
                                  strokeDasharray={`${pct} ${100 - pct}`}
                                  strokeLinecap="round"
                                  style={{
                                    transition: "stroke-dasharray 0.6s ease",
                                  }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-slate-800">
                                  {pct}%
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  complete
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">
                              {completed} of {appraisals.length} appraisals
                              finalised
                            </p>
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

      {/* ── LEAVE APPROVALS TAB ── */}
      {tab === "leaves" &&
        (loadingLeaves ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* KPI row */}
            <div className="mb-2">
              <KpiSummaryStrip
                className="lg:grid-cols-5"
                items={[
                  {
                    label: "Approvals Done",
                    value: leaveApprovalsDone,
                    hint: "Approved + completed",
                    accent: "violet",
                    icon: CalendarCheck,
                  },
                  {
                    label: "Active",
                    value: leaveApprovedCount,
                    hint: "Approved, not yet returned",
                    accent: "emerald",
                    icon: CheckCircle2,
                  },
                  {
                    label: "Completed",
                    value: leaveCompletedCount,
                    hint: "Returned to office",
                    accent: "sky",
                    icon: CalendarCheck,
                  },
                  {
                    label: "Rejected",
                    value: leaveRejectedCount,
                    hint: "Declined requests",
                    accent: "rose",
                    icon: XCircle,
                  },
                  {
                    label: "Leave Days Approved",
                    value: leaveDaysApproved,
                    hint: "Across approved leaves",
                    accent: "amber",
                    icon: Clock,
                  },
                ]}
              />
            </div>

            {/* List of approvals */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <SectionTitle
                  icon={CalendarCheck}
                  label="Leave Approvals"
                  color="text-violet-600"
                />
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={leaveSearch}
                    onChange={(e) => setLeaveSearch(e.target.value)}
                    placeholder="Search employee, type or status…"
                    className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                  />
                </div>
              </div>

              {filteredLeaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-slate-400">
                  <CalendarCheck className="h-10 w-10 text-slate-200" />
                  <p className="text-sm font-medium">
                    {leaveApprovals.length === 0
                      ? "No leave approvals yet"
                      : "No approvals match your search"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Employee
                        </th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Leave Type
                        </th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Period
                        </th>
                        <th className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Days
                        </th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Applied On
                        </th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredLeaves.map((l) => {
                        const meta = LEAVE_STATUS_META[l.leaveStatus] ?? {
                          label: l.leaveStatus,
                          cls: "bg-slate-50 text-slate-600 border-slate-200",
                          icon: Clock,
                        };
                        const StatusIcon = meta.icon;
                        return (
                          <tr key={l.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 font-medium text-slate-800">
                              {l.employeeName || "—"}
                              {l.leaveCode && (
                                <span className="ml-2 font-mono text-[11px] text-slate-400">
                                  {l.leaveCode}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-slate-600">
                              {l.leaveType || "—"}
                            </td>
                            <td className="py-2.5 text-slate-500 tabular-nums text-xs">
                              {fmtDay(l.startDate)} → {fmtDay(l.endDate)}
                            </td>
                            <td className="py-2.5 text-center">
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-50 px-2 text-xs font-bold text-blue-700">
                                {l.totalDays ?? 0}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-500 tabular-nums text-xs">
                              {fmtDay(l.dateReported)}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                                  meta.cls,
                                )}
                              >
                                <StatusIcon className="h-3 w-3" />
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
        ))}

      {/* ── LOAN APPROVALS TAB ── */}
      {tab === "loans" &&
        (loadingLoans ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* KPI row */}
            <div className="mb-2">
              <KpiSummaryStrip
                className="lg:grid-cols-5"
                items={[
                  {
                    label: "Approvals Done",
                    value: loanApprovalsDone,
                    hint: "Active + closed",
                    accent: "violet",
                    icon: Wallet,
                  },
                  {
                    label: "Active",
                    value: loanActiveCount,
                    hint: "Currently being repaid",
                    accent: "emerald",
                    icon: CheckCircle2,
                  },
                  {
                    label: "Closed",
                    value: loanClosedCount,
                    hint: "Fully repaid",
                    accent: "sky",
                    icon: Banknote,
                  },
                  {
                    label: "Rejected",
                    value: loanRejectedCount,
                    hint: "Declined requests",
                    accent: "rose",
                    icon: XCircle,
                  },
                  {
                    label: "Amount Approved",
                    value: formatMoney(String(loanAmountApproved), loanCurrency),
                    hint: "Across approved loans",
                    accent: "amber",
                    icon: TrendingUp,
                  },
                ]}
              />
            </div>

            {/* List of approvals */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <SectionTitle
                  icon={Wallet}
                  label="Loan Approvals"
                  color="text-violet-600"
                />
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={loanSearch}
                    onChange={(e) => setLoanSearch(e.target.value)}
                    placeholder="Search employee, type or status…"
                    className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                  />
                </div>
              </div>

              {filteredLoans.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-slate-400">
                  <Wallet className="h-10 w-10 text-slate-200" />
                  <p className="text-sm font-medium">
                    {loanApprovals.length === 0
                      ? "No loan approvals yet"
                      : "No approvals match your search"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Employee
                        </th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Loan Type
                        </th>
                        <th className="py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Amount
                        </th>
                        <th className="py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Monthly
                        </th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Start Date
                        </th>
                        <th className="py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredLoans.map((l) => {
                        const meta = LOAN_STATUS_META[l.status] ?? {
                          label: l.status,
                          cls: "bg-slate-50 text-slate-600 border-slate-200",
                          icon: Clock,
                        };
                        const StatusIcon = meta.icon;
                        const sym = l.currencySymbol || loanCurrency;
                        return (
                          <tr key={l.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 font-medium text-slate-800">
                              {l.employeeName || "—"}
                              {l.loanCode && (
                                <span className="ml-2 font-mono text-[11px] text-slate-400">
                                  {l.loanCode}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-slate-600">
                              {humanizeLoan(l.loanType)}
                            </td>
                            <td className="py-2.5 text-right tabular-nums font-medium text-slate-800">
                              {formatMoney(String(l.loanAmount ?? 0), sym)}
                            </td>
                            <td className="py-2.5 text-right tabular-nums text-slate-500">
                              {formatMoney(String(l.monthlyDeduction ?? 0), sym)}
                            </td>
                            <td className="py-2.5 text-slate-500 tabular-nums text-xs">
                              {fmtDay(l.startDate)}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                                  meta.cls,
                                )}
                              >
                                <StatusIcon className="h-3 w-3" />
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
        ))}

      {/* ── IMMIGRATION EXPIRY TAB ── */}
      {tab === "immigration" && <ImmigrationExpiryReport />}

      {tab === "history" && <HistoryTabPanel module="hr" />}
    </div>
  );
}
