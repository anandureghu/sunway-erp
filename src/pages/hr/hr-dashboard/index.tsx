import {
  DashboardErrorBanner,
  DashboardPageHeader,
  useDashboardQuery,
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { getHrDashboard } from "@/service/hrDashboardService";
import { LayoutDashboard } from "lucide-react";
import { useCallback } from "react";
import { HrDashboardAnalyticsTabs } from "./hr-dashboard-analytics-tabs";
import { HrDashboardKpisPanel } from "./hr-dashboard-kpis";
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
        pendingApprovals={data?.pendingApprovals ?? null}
        documents={data?.documentsExpiring ?? null}
        loading={loading}
      />

      <HrDashboardAnalyticsTabs
        departments={data?.employeesByDepartment ?? []}
        leaveTrend={data?.leaveTrendLast12Months ?? []}
        leaveSummary={data?.leaveSummaryThisMonth ?? null}
        recentActivities={data?.recentHrActivities ?? []}
        loading={loading}
      />
    </div>
  );
}
