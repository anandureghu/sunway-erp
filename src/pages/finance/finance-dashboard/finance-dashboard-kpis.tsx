import {
  DashboardKpiSkeleton,
} from "@/components/dashboard";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import { formatMoney } from "@/lib/utils";
import type { FinanceDashboardKpis } from "@/types/financeDashboard";
import {
  AlertCircle,
  Banknote,
  CircleDollarSign,
  ClipboardCheck,
  PieChart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

export function FinanceDashboardKpis({
  kpis,
  currencyCode,
  loading,
}: {
  kpis: FinanceDashboardKpis | null;
  currencyCode?: string;
  loading: boolean;
}) {
  if (loading || !kpis) {
    return <DashboardKpiSkeleton count={8} />;
  }

  const fmt = (v: number) => formatMoney(v, currencyCode);

  return (
    <KpiSummaryStrip
      className="sm:grid-cols-2 xl:grid-cols-4"
      items={[
        {
          label: "Revenue (This Month)",
          value: fmt(kpis.revenueThisMonth),
          hint: "Current month",
          accent: "violet",
          icon: TrendingUp,
        },
        {
          label: "Expenses (This Month)",
          value: fmt(kpis.expensesThisMonth),
          hint: "Current month",
          accent: "rose",
          icon: TrendingDown,
        },
        {
          label: "Outstanding Receivables",
          value: fmt(kpis.receivablesOutstanding),
          hint: "Open customer invoices",
          accent: "emerald",
          icon: CircleDollarSign,
        },
        {
          label: "Outstanding Payables",
          value: fmt(kpis.payablesOutstanding),
          hint: "Open vendor bills",
          accent: "orange",
          icon: Wallet,
        },
        {
          label: "Cash Available",
          value: fmt(kpis.cashBalance),
          hint: "Bank & cash balance",
          accent: "sky",
          icon: Banknote,
        },
        {
          label: "Net Profit (This Month)",
          value: fmt(kpis.netProfitThisMonth),
          hint: "Revenue − expenses",
          accent: kpis.netProfitThisMonth >= 0 ? "violet" : "rose",
          icon: TrendingUp,
        },
        {
          label: "Budget Utilization",
          value: `${Math.round(kpis.budgetUtilizationPercent)}%`,
          hint: "YTD across departments",
          accent: "blue",
          icon: PieChart,
        },
        {
          label: "Pending Approvals",
          value: kpis.pendingApprovalsCount,
          hint: "Actions required",
          accent: "amber",
          icon: kpis.pendingApprovalsCount > 0 ? AlertCircle : ClipboardCheck,
        },
      ]}
    />
  );
}
