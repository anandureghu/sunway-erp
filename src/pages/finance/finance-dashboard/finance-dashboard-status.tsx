import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatMoney } from "@/lib/utils";
import type {
  FinanceDashboardAlert,
  FinanceDashboardPaymentStatus,
} from "@/types/financeDashboard";
import { AlertTriangle } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";

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
  const statusData = paymentStatus
    ? [
        { name: "Paid", value: paymentStatus.paidCount, fill: STATUS_COLORS.paid },
        {
          name: "Partially Paid",
          value: paymentStatus.partiallyPaidCount,
          fill: STATUS_COLORS.partial,
        },
        {
          name: "Unpaid",
          value: paymentStatus.unpaidCount,
          fill: STATUS_COLORS.unpaid,
        },
      ].filter((s) => s.value > 0)
    : [];
  const statusTotal = paymentStatus?.totalCount ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Payment Status (Invoices)</CardTitle>
      </CardHeader>
      <CardContent>
        {statusTotal === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No invoice status data.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-full max-w-[180px]">
              <ChartContainer
                config={{ value: { label: "Invoices" } }}
                className="mx-auto aspect-square h-[160px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={70}
                    strokeWidth={2}
                  >
                    {statusData.map((s) => (
                      <Cell key={s.name} fill={s.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-bold tabular-nums">{statusTotal}</p>
                <p className="text-[10px] text-muted-foreground">Invoices</p>
              </div>
            </div>
            <ul className="w-full space-y-1.5 text-xs">
              {[
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
              ].map((s) => (
                <li
                  key={s.name}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: s.fill }}
                    />
                    {s.name}
                  </span>
                  <span className="font-medium tabular-nums">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CriticalAlertsCard({
  alerts,
  currencyCode,
}: {
  alerts: FinanceDashboardAlert[];
  currencyCode?: string;
}) {
  const fmt = (v: number) => formatMoney(v, currencyCode);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Critical Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No critical alerts.
          </p>
        ) : (
          alerts.map((alert, idx) => (
            <div
              key={`${alert.type}-${idx}`}
              className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2.5 dark:border-red-900/40 dark:bg-red-950/30"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-200">
                  {alert.message || alert.type}
                </p>
                <p className="mt-0.5 text-xs text-red-700/80 dark:text-red-300/80">
                  {alert.count > 0 ? `${alert.count} items` : null}
                  {alert.count > 0 && alert.amount > 0 ? " · " : null}
                  {alert.amount > 0 ? fmt(alert.amount) : null}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
