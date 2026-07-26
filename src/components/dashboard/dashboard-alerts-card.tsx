import { AlertTriangle } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { DashboardEmpty } from "./dashboard-empty";
import { DashboardSectionCard } from "./dashboard-section-card";

export type DashboardAlertItem = {
  type: string;
  message: string;
  count: number;
  amount: number;
};

export function DashboardAlertsCard({
  title = "Critical Alerts",
  alerts,
  currencyCode,
  emptyMessage = "No critical alerts.",
  showAmount = true,
}: {
  title?: string;
  alerts: DashboardAlertItem[];
  currencyCode?: string;
  emptyMessage?: string;
  showAmount?: boolean;
}) {
  return (
    <DashboardSectionCard title={title}>
      {alerts.length === 0 ? (
        <DashboardEmpty message={emptyMessage} />
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
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
                  {showAmount &&
                  alert.count > 0 &&
                  alert.amount > 0
                    ? " · "
                    : null}
                  {showAmount && alert.amount > 0
                    ? formatMoney(alert.amount, currencyCode)
                    : null}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardSectionCard>
  );
}
