import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { FinanceDashboardCharts } from "./finance-dashboard-charts";
import { FinanceDashboardKpis } from "./finance-dashboard-kpis";
import { FinanceDashboardPanels } from "./finance-dashboard-panels";
import { FinanceDashboardTables } from "./finance-dashboard-tables";
import { formatTime } from "./finance-dashboard-utils";
import { useFinanceDashboard } from "./use-finance-dashboard";

export default function FinanceDashboardPage() {
  const { company } = useAuth();
  const currencyCode = company?.currency?.currencyCode;
  const { data, loading, error, refresh } = useFinanceDashboard();

  const companyName = company?.companyName ?? "your company";

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Finance Manager Dashboard"
        description={`Welcome back! Here's the financial overview of ${companyName}`}
        variant="darkBlue"
        icon={<LayoutDashboard className="h-6 w-6" />}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {data?.generatedAt ? (
              <span className="text-xs text-white/80">
                Last updated: {formatTime(data.generatedAt)}
              </span>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void refresh()}
              disabled={loading}
              className="border border-white/25 bg-white/15 text-white hover:bg-white/25 hover:text-white"
            >
              <RefreshCw
                className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              />
              Refresh
            </Button>
          </div>
        }
      />

      {error && !loading ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <FinanceDashboardKpis
        kpis={data?.kpis ?? null}
        currencyCode={currencyCode}
        loading={loading}
      />

      {/* <FinanceDashboardCharts
        trend={data?.revenueExpenseTrend ?? []}
        receivablesAging={data?.receivablesAging ?? null}
        payablesAging={data?.payablesAging ?? null}
        currencyCode={currencyCode}
        loading={loading}
      /> */}

      {/* <FinanceDashboardTables
        overdueReceivables={data?.topOverdueReceivables ?? []}
        payablesDue={data?.topPayablesDue ?? []}
        budgets={data?.budgetUtilizationByDepartment ?? []}
        currencyCode={currencyCode}
        loading={loading}
      /> */}

      <FinanceDashboardPanels
        pendingApprovals={data?.pendingApprovals ?? null}
        transactions={data?.recentFinancialTransactions ?? []}
        paymentStatus={data?.paymentStatus ?? null}
        alerts={data?.criticalAlerts ?? []}
        currencyCode={currencyCode}
        loading={loading}
      />
    </div>
  );
}
