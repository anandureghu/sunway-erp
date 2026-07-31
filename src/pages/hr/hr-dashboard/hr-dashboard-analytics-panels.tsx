import {
  DashboardDonutCard,
  DashboardEmpty,
  DashboardProgressListCard,
  DashboardSectionCard,
  compactNumber,
  formatShortDate,
  formatTime,
  monthLabel,
} from "@/components/dashboard";
import { TablePagination, usePagination } from "@/components/table-pagination";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  HrEmployeesByDepartment,
  HrLeaveSummaryThisMonth,
  HrLeaveTrendPoint,
  HrRecentActivity,
} from "@/types/hrDashboard";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const trendConfig = {
  count: { label: "Leave requests", color: "hsl(262 83% 58%)" },
} satisfies ChartConfig;

export function DepartmentsPanel({
  departments,
}: {
  departments: HrEmployeesByDepartment[];
}) {
  return (
    <DashboardProgressListCard
      title="Employees on leave by department"
      description="Headcount distribution"
      emptyMessage="No department headcount data."
      rows={departments.map((d) => ({
        id: d.departmentId,
        label: d.departmentName,
        percent: d.percent,
        leftHint: `${d.employeeCount.toLocaleString()} employees`,
      }))}
    />
  );
}

export function LeaveTrendPanel({
  leaveTrend,
}: {
  leaveTrend: HrLeaveTrendPoint[];
}) {
  const chartData = leaveTrend.map((p) => ({
    ...p,
    label: monthLabel(p.yearMonth),
  }));

  return (
    <DashboardSectionCard title="Leave Trend" description="Last 12 months">
      {chartData.length === 0 ? (
        <DashboardEmpty message="No leave trend data yet." className="h-56" />
      ) : (
        <ChartContainer config={trendConfig} className="h-72 w-full">
          <BarChart data={chartData} margin={{ left: 4, right: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis
              tickFormatter={(v) => compactNumber(Number(v))}
              tickLine={false}
              axisLine={false}
              width={36}
              fontSize={11}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </DashboardSectionCard>
  );
}

export function LeaveSummaryPanel({
  leaveSummary,
}: {
  leaveSummary: HrLeaveSummaryThisMonth | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DashboardDonutCard
        title="Leave Summary (This Month)"
        description="Request outcomes"
        slices={[
          {
            name: "Approved",
            value: leaveSummary?.approved ?? 0,
            fill: "#22c55e",
          },
          {
            name: "Pending",
            value: leaveSummary?.pending ?? 0,
            fill: "#f59e0b",
          },
          {
            name: "Rejected",
            value: leaveSummary?.rejected ?? 0,
            fill: "#ef4444",
          },
        ]}
        centerLabel="Requests"
        centerValue={leaveSummary?.totalRequests ?? 0}
        emptyMessage="No leave requests this month."
      />
      <DashboardSectionCard
        title="Leave Snapshot"
        description="This month at a glance"
      >
        <dl className="grid grid-cols-2 gap-3">
          {[
            { label: "Total requests", value: leaveSummary?.totalRequests ?? 0 },
            { label: "Approved", value: leaveSummary?.approved ?? 0 },
            { label: "Pending", value: leaveSummary?.pending ?? 0 },
            { label: "Rejected", value: leaveSummary?.rejected ?? 0 },
            { label: "On leave today", value: leaveSummary?.onLeaveToday ?? 0 },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-lg border bg-muted/30 px-3 py-3"
            >
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">
                {row.value.toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
      </DashboardSectionCard>
    </div>
  );
}

export function RecentActivitiesPanel({
  activities,
}: {
  activities: HrRecentActivity[];
}) {
  const {
    pageItems,
    pageIndex,
    pageSize,
    pageCount,
    total,
    setPageIndex,
    setPageSize,
  } = usePagination(activities, 10);

  if (activities.length === 0) {
    return (
      <DashboardSectionCard
        title="Recent HR Activities"
        description="Latest updates"
      >
        <DashboardEmpty message="No recent activity." />
      </DashboardSectionCard>
    );
  }

  return (
    <DashboardSectionCard
      title="Recent HR Activities"
      description="Latest updates"
    >
      <div className="space-y-2">
        {pageItems.map((activity, idx) => (
          <div
            key={`${activity.occurredAt}-${pageIndex}-${idx}`}
            className="rounded-lg border px-3 py-2.5"
          >
            <p className="text-sm font-medium leading-snug">
              {activity.description}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {activity.employeeName}
              {activity.occurredAt
                ? ` · ${formatShortDate(activity.occurredAt)} ${formatTime(activity.occurredAt)}`
                : null}
            </p>
          </div>
        ))}
      </div>
      <TablePagination
        total={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[5, 10, 20, 30]}
      />
    </DashboardSectionCard>
  );
}
