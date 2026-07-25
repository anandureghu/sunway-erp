import {
  DashboardErrorBanner,
  DashboardPageHeader,
  useDashboardQuery,
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { getHrDashboard } from "@/service/hrDashboardService";
import { LayoutDashboard } from "lucide-react";
import { useCallback } from "react";
import { HrDashboardCharts } from "./hr-dashboard-charts";
import { HrDashboardKpisPanel } from "./hr-dashboard-kpis";
import { HrDashboardLists } from "./hr-dashboard-lists";
import { HrDashboardOverview } from "./hr-dashboard-overview";

export default function HrDashboardPage() {
  const { company } = useAuth();
  const fetcher = useCallback(() => getHrDashboard(), []);
  const { data, loading, error, refresh } = useDashboardQuery(
    fetcher,
    "Could not load HR dashboard",
  );

  const companyName = company?.companyName ?? "your company";

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="HR Dashboard"
        description={`Welcome back! Here's the people overview of ${companyName}`}
        variant="darkBlue"
        icon={<LayoutDashboard className="h-6 w-6" />}
        generatedAt={data?.generatedAt}
        loading={loading}
        onRefresh={() => void refresh()}
      />

      {error && !loading ? (
        <DashboardErrorBanner
          message={error}
          onRetry={() => void refresh()}
        />
      ) : null}

      <HrDashboardKpisPanel kpis={data?.kpis ?? null} loading={loading} />

      <HrDashboardOverview
        workforce={data?.workforceStatusToday ?? null}
        leaveSummary={data?.leaveSummaryThisMonth ?? null}
        pendingApprovals={data?.pendingApprovals ?? null}
        loading={loading}
      />

      <HrDashboardCharts
        departments={data?.employeesByDepartment ?? []}
        leaveTrend={data?.leaveTrendLast12Months ?? []}
        loading={loading}
      />

      <HrDashboardLists
        compliance={data?.complianceAlerts ?? null}
        documents={data?.documentsExpiring ?? null}
        upcomingEvents={data?.upcomingHrEvents ?? []}
        recentActivities={data?.recentHrActivities ?? []}
        loading={loading}
      />
    </div>
  );
}
