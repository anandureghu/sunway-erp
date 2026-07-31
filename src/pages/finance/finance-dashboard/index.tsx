import { useCallback } from "react";
import {
  DashboardErrorBanner,
  DashboardPageHeader,
  useDashboardQuery,
} from "@/components/dashboard";
import { useAuth } from "@/context/AuthContext";
import { getFinanceDashboard } from "@/service/financeDashboardService";
import { LayoutDashboard } from "lucide-react";
import { FinanceDashboardCharts } from "./finance-dashboard-charts";
import { FinanceDashboardKpis } from "./finance-dashboard-kpis";
import { FinanceDashboardPanels } from "./finance-dashboard-panels";
import { FinanceDashboardTables } from "./finance-dashboard-tables";

export default function FinanceDashboardPage() {
  const { company } = useAuth();
  const currencyCode = company?.currency?.currencyCode;
  const fetcher = useCallback(() => getFinanceDashboard(), []);
  const { data, loading, error, refresh } = useDashboardQuery(
    fetcher,
    "Could not load finance dashboard",
  );

  const companyName = company?.companyName ?? "your company";

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Finance Manager Dashboard"
        description={`Welcome back! Here's the financial overview of ${companyName}`}
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

      <FinanceDashboardKpis
        kpis={data?.kpis ?? null}
        currencyCode={currencyCode}
        loading={loading}
      />

      <FinanceDashboardCharts
        trend={data?.revenueExpenseTrend ?? []}
        receivablesAging={data?.receivablesAging ?? null}
        payablesAging={data?.payablesAging ?? null}
        currencyCode={currencyCode}
        loading={loading}
      />

      <FinanceDashboardTables
        overdueReceivables={data?.topOverdueReceivables ?? []}
        payablesDue={data?.topPayablesDue ?? []}
        budgets={data?.budgetUtilizationByDepartment ?? []}
        currencyCode={currencyCode}
        loading={loading}
      />

      <FinanceDashboardPanels
        pendingApprovals={data?.pendingApprovals ?? null}
        paymentStatus={data?.paymentStatus ?? null}
        alerts={data?.criticalAlerts ?? []}
        currencyCode={currencyCode}
        loading={loading}
      />
    </div>
  );
}
