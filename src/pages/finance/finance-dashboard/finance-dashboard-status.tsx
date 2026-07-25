import {
  DashboardAlertsCard,
  DashboardDonutCard,
} from "@/components/dashboard";
import type {
  FinanceDashboardAlert,
  FinanceDashboardPaymentStatus,
} from "@/types/financeDashboard";

const STATUS_COLORS = {
  paid: "#22c55e",
  partial: "#f97316",
  unpaid: "#ef4444",
};

export function PaymentStatusCard({
  paymentStatus,
}: {
  paymentStatus: FinanceDashboardPaymentStatus | null;
}) {
  const slices = [
    {
      name: "Paid",
      value: paymentStatus?.paidCount ?? 0,
      fill: STATUS_COLORS.paid,
    },
    {
      name: "Partially Paid",
      value: paymentStatus?.partiallyPaidCount ?? 0,
      fill: STATUS_COLORS.partial,
    },
    {
      name: "Unpaid",
      value: paymentStatus?.unpaidCount ?? 0,
      fill: STATUS_COLORS.unpaid,
    },
  ];

  return (
    <DashboardDonutCard
      title="Payment Status (Invoices)"
      slices={slices}
      centerLabel="Invoices"
      centerValue={paymentStatus?.totalCount ?? 0}
      emptyMessage="No invoice status data."
      size="sm"
    />
  );
}

export function CriticalAlertsCard({
  alerts,
  currencyCode,
}: {
  alerts: FinanceDashboardAlert[];
  currencyCode?: string;
}) {
  return (
    <DashboardAlertsCard
      title="Critical Alerts"
      alerts={alerts}
      currencyCode={currencyCode}
    />
  );
}
