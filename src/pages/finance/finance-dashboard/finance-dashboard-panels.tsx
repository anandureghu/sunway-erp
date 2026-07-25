import { DashboardCardSkeletonGrid } from "@/components/dashboard";
import type {
  FinanceDashboardAlert,
  FinanceDashboardPaymentStatus,
  FinanceDashboardPendingApprovals,
  FinanceDashboardTransaction,
} from "@/types/financeDashboard";
import {
  PendingApprovalsCard,
  RecentTransactionsCard,
} from "./finance-dashboard-activity";
import {
  CriticalAlertsCard,
  PaymentStatusCard,
} from "./finance-dashboard-status";

export function FinanceDashboardPanels({
  pendingApprovals,
  transactions,
  paymentStatus,
  alerts,
  currencyCode,
  loading,
}: {
  pendingApprovals: FinanceDashboardPendingApprovals | null;
  transactions: FinanceDashboardTransaction[];
  paymentStatus: FinanceDashboardPaymentStatus | null;
  alerts: FinanceDashboardAlert[];
  currencyCode?: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <DashboardCardSkeletonGrid
        count={4}
        className="md:grid-cols-2 xl:grid-cols-4"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <PendingApprovalsCard pendingApprovals={pendingApprovals} />
      <RecentTransactionsCard
        transactions={transactions}
        currencyCode={currencyCode}
      />
      <PaymentStatusCard paymentStatus={paymentStatus} />
      <CriticalAlertsCard alerts={alerts} currencyCode={currencyCode} />
    </div>
  );
}
