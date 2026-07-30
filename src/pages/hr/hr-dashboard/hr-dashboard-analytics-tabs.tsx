import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardCardSkeletonGrid } from "@/components/dashboard";
import { cn } from "@/lib/utils";
import type {
  HrEmployeesByDepartment,
  HrLeaveSummaryThisMonth,
  HrLeaveTrendPoint,
  HrRecentActivity,
} from "@/types/hrDashboard";
import {
  Activity,
  Building2,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import {
  DepartmentsPanel,
  LeaveSummaryPanel,
  LeaveTrendPanel,
  RecentActivitiesPanel,
} from "./hr-dashboard-analytics-panels";

const TABS = [
  { id: "departments", label: "Employees by Department", icon: Building2 },
  { id: "leave-trend", label: "Leave Trend", icon: TrendingUp },
  { id: "leave-summary", label: "Leave Summary", icon: CalendarDays },
  { id: "activities", label: "Recent HR Activities", icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_IDS: TabId[] = TABS.map((t) => t.id);

function isTabId(value: string | null): value is TabId {
  return !!value && (TAB_IDS as string[]).includes(value);
}

export function HrDashboardAnalyticsTabs({
  departments,
  leaveTrend,
  leaveSummary,
  recentActivities,
  loading,
}: {
  departments: HrEmployeesByDepartment[];
  leaveTrend: HrLeaveTrendPoint[];
  leaveSummary: HrLeaveSummaryThisMonth | null;
  recentActivities: HrRecentActivity[];
  loading: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTab = searchParams.get("tab");
  const initialTab = isTabId(paramTab) ? paramTab : "departments";
  const [tab, setTab] = useState<TabId>(initialTab);

  useEffect(() => {
    if (isTabId(paramTab) && paramTab !== tab) setTab(paramTab);
  }, [paramTab, tab]);

  const onTabChange = (id: TabId) => {
    setTab(id);
    const next = new URLSearchParams(searchParams);
    next.set("tab", id);
    setSearchParams(next, { replace: true });
  };

  const content = useMemo(() => {
    switch (tab) {
      case "departments":
        return <DepartmentsPanel departments={departments} />;
      case "leave-trend":
        return <LeaveTrendPanel leaveTrend={leaveTrend} />;
      case "leave-summary":
        return <LeaveSummaryPanel leaveSummary={leaveSummary} />;
      case "activities":
        return <RecentActivitiesPanel activities={recentActivities} />;
      default:
        return null;
    }
  }, [tab, departments, leaveTrend, leaveSummary, recentActivities]);

  if (loading) {
    return (
      <DashboardCardSkeletonGrid
        count={1}
        className="grid-cols-1"
        cardClassName="h-[420px] rounded-xl"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex w-fit flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              tab === id
                ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      {content}
    </div>
  );
}
