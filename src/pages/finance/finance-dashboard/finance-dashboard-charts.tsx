import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/utils";
import type {
  FinanceDashboardAging,
  FinanceDashboardTrendPoint,
} from "@/types/financeDashboard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  agingSlices,
  compactNumber,
  monthLabel,
  sumAging,
} from "./finance-dashboard-utils";

const trendConfig = {
  revenue: { label: "Revenue", color: "hsl(217 91% 60%)" },
  expense: { label: "Expenses", color: "hsl(330 81% 60%)" },
} satisfies ChartConfig;

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function AgingDonut({
  title,
  aging,
  currencyCode,
}: {
  title: string;
  aging: FinanceDashboardAging;
  currencyCode?: string;
}) {
  const slices = agingSlices(aging).filter((s) => s.amount > 0);
  const total = sumAging(aging);
  const fmt = (v: number) => formatMoney(v, currencyCode);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>Outstanding by age bucket</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyChart message="Nothing outstanding." />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full max-w-[220px]">
              <ChartContainer
                config={{ amount: { label: "Amount" } }}
                className="mx-auto aspect-square h-[200px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => fmt(Number(value))}
                      />
                    }
                  />
                  <Pie
                    data={slices}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={84}
                    strokeWidth={2}
                  >
                    {slices.map((s) => (
                      <Cell key={s.name} fill={s.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Total
                </p>
                <p className="text-sm font-bold tabular-nums">{fmt(total)}</p>
              </div>
            </div>
            <ul className="w-full space-y-1.5 text-xs">
              {agingSlices(aging).map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.fill }}
                    />
                    {s.name}
                    <span className="text-[10px]">({s.count})</span>
                  </span>
                  <span className="font-medium tabular-nums">{fmt(s.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Skeleton className="h-[360px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[360px] rounded-xl" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
    );
  }

  const chartData = trend.map((p) => ({
    ...p,
    label: monthLabel(p.yearMonth),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue vs Expense Trend</CardTitle>
          <CardDescription>Last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyChart message="No trend data yet." />
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
        </CardContent>
      </Card>

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
