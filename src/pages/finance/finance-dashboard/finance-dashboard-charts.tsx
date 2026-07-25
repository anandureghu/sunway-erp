import {
  DashboardCardSkeletonGrid,
  DashboardDonutCard,
  DashboardEmpty,
  DashboardSectionCard,
  compactNumber,
  monthLabel,
} from "@/components/dashboard";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney } from "@/lib/utils";
import type {
  FinanceDashboardAging,
  FinanceDashboardTrendPoint,
} from "@/types/financeDashboard";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { agingSlices, sumAging } from "./finance-dashboard-utils";

const trendConfig = {
  revenue: { label: "Revenue", color: "hsl(217 91% 60%)" },
  expense: { label: "Expenses", color: "hsl(330 81% 60%)" },
} satisfies ChartConfig;

function AgingDonut({
  title,
  aging,
  currencyCode,
}: {
  title: string;
  aging: FinanceDashboardAging;
  currencyCode?: string;
}) {
  const fmt = (v: number) => formatMoney(v, currencyCode);
  return (
    <DashboardDonutCard
      title={title}
      description="Outstanding by age bucket"
      slices={agingSlices(aging)}
      centerLabel="Total"
      centerValue={fmt(sumAging(aging))}
      emptyMessage="Nothing outstanding."
      formatValue={fmt}
    />
  );
}

export function FinanceDashboardCharts({
  trend,
  receivablesAging,
  payablesAging,
  currencyCode,
  loading,
}: {
  trend: FinanceDashboardTrendPoint[];
  receivablesAging: FinanceDashboardAging | null;
  payablesAging: FinanceDashboardAging | null;
  currencyCode?: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <DashboardCardSkeletonGrid
        count={3}
        className="lg:grid-cols-4"
        cardClassName="h-[360px] rounded-xl lg:first:col-span-2"
      />
    );
  }

  const chartData = trend.map((p) => ({
    ...p,
    label: monthLabel(p.yearMonth),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <DashboardSectionCard
        title="Revenue vs Expense Trend"
        description="Last 12 months"
        className="lg:col-span-2"
      >
        {chartData.length === 0 ? (
          <DashboardEmpty message="No trend data yet." className="h-56" />
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
                width={40}
                fontSize={11}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) =>
                      `${name === "revenue" ? "Revenue" : "Expenses"}: ${formatMoney(Number(value), currencyCode)}`
                    }
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="revenue"
                fill="var(--color-revenue)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                fill="var(--color-expense)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </DashboardSectionCard>

      {receivablesAging && (
        <AgingDonut
          title="Receivables Aging"
          aging={receivablesAging}
          currencyCode={currencyCode}
        />
      )}
      {payablesAging && (
        <AgingDonut
          title="Payables Aging"
          aging={payablesAging}
          currencyCode={currencyCode}
        />
      )}
    </div>
  );
}
