import {
  DashboardDonutCard,
  DashboardEmpty,
  DashboardSectionCard,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  percentOfTotal,
  type HrDashboardInsights,
} from "@/lib/hr-dashboard-analytics";

const NATIONALITY_COLORS = [
  "#1e3a8a",
  "#166534",
  "#6d28d9",
  "#c2410c",
  "#92400e",
  "#991b1b",
  "#64748b",
];

const CONTRACT_COLORS = ["#166534", "#1e3a8a", "#6d28d9", "#c2410c"];

const LEAVE_BAR_CLASS: Record<string, string> = {
  "Annual leave": "[&>div]:bg-blue-600",
  "Sick leave": "[&>div]:bg-orange-600",
  Maternity: "[&>div]:bg-violet-600",
  Unpaid: "[&>div]:bg-slate-400",
  Other: "[&>div]:bg-slate-500",
};

export function WorkforceNationalityCard({
  slices,
}: {
  slices: HrDashboardInsights["workforceByNationality"];
}) {
  const format = percentOfTotal(slices);

  return (
    <DashboardDonutCard
      title="Workforce by nationality"
      slices={slices.map((row, i) => ({
        name: row.name,
        value: row.value,
        fill: NATIONALITY_COLORS[i % NATIONALITY_COLORS.length],
        count: row.value,
      }))}
      formatValue={format}
      emptyMessage="No nationality data on employee profiles."
      size="sm"
    />
  );
}

export function ContractTypesCard({
  slices,
}: {
  slices: HrDashboardInsights["contractTypes"];
}) {
  return (
    <DashboardDonutCard
      title="Contract types"
      slices={slices.map((row, i) => ({
        name: row.name,
        value: row.value,
        fill: CONTRACT_COLORS[i % CONTRACT_COLORS.length],
        count: row.value,
      }))}
      formatValue={(value) => String(value)}
      emptyMessage="No contract type data available."
      size="sm"
    />
  );
}

export function LeaveUtilizationCard({
  data,
}: {
  data: HrDashboardInsights["leaveUtilization"];
}) {
  const totalLeaveDays = data.rows.reduce((sum, row) => sum + row.days, 0);

  return (
    <DashboardSectionCard
      title={`Leave utilization — ${data.monthLabel}`}
      description="Approved leave days taken this month (share by type)"
      viewAllTo="/hr/settings?tab=leave-approvals"
    >
      {data.rows.length === 0 ? (
        <DashboardEmpty message="No approved leave recorded this month." />
      ) : (
        <div className="space-y-4">
          {data.rows.map((row) => (
            <div key={row.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{row.label}</span>
                <span className="text-right text-xs text-muted-foreground">
                  <span className="font-medium text-foreground tabular-nums">
                    {row.days}
                  </span>{" "}
                  {row.days === 1 ? "day" : "days"} ·{" "}
                  <span className="tabular-nums">{row.percent}%</span> of month
                </span>
              </div>
              <Progress
                value={row.percent}
                className={cn(
                  "h-2",
                  LEAVE_BAR_CLASS[row.label] ?? "[&>div]:bg-slate-500",
                )}
              />
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">
            {totalLeaveDays} approved leave{" "}
            {totalLeaveDays === 1 ? "day" : "days"} recorded in{" "}
            {data.monthLabel}.
          </p>
        </div>
      )}
      <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
        Out of office today{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {data.onLeaveToday}
        </span>{" "}
        /{" "}
        <span className="tabular-nums">{data.totalEmployees.toLocaleString()}</span>{" "}
        employees
      </p>
    </DashboardSectionCard>
  );
}
