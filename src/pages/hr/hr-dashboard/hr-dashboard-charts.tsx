import {
  DashboardCardSkeletonGrid,
  DashboardEmpty,
  DashboardProgressListCard,
  DashboardSectionCard,
  compactNumber,
  monthLabel,
} from "@/components/dashboard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  HrEmployeesByDepartment,
  HrLeaveTrendPoint,
} from "@/types/hrDashboard";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const trendConfig = {
  count: { label: "Leave requests", color: "hsl(262 83% 58%)" },
} satisfies ChartConfig;

export function HrDashboardCharts({
  departments,
  leaveTrend,
  loading,
}: {
  departments: HrEmployeesByDepartment[];
  leaveTrend: HrLeaveTrendPoint[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <DashboardCardSkeletonGrid
        count={2}
        className="lg:grid-cols-2"
        cardClassName="h-[340px] rounded-xl"
      />
    );
  }

  const chartData = leaveTrend.map((p) => ({
    ...p,
    label: monthLabel(p.yearMonth),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DashboardProgressListCard
        title="Employees by Department"
        description="Headcount distribution"
        emptyMessage="No department headcount data."
        rows={departments.map((d) => ({
          id: d.departmentId,
          label: d.departmentName,
          percent: d.percent,
          leftHint: `${d.employeeCount.toLocaleString()} employees`,
        }))}
      />

      <DashboardSectionCard
        title="Leave Trend"
        description="Last 12 months"
      >
        {chartData.length === 0 ? (
          <DashboardEmpty message="No leave trend data yet." className="h-56" />
        ) : (
          <ChartContainer config={trendConfig} className="h-64 w-full">
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
    </div>
  );
}
