import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { formatMoney } from "@/lib/utils";
import { getFinanceSummary } from "@/service/financeReportService";
import type {
  FinanceAgingBuckets,
  FinanceReportSummary,
} from "@/types/financeReport";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  Download,
  PieChart as PieChartIcon,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

// =====================================================
// Helpers
// =====================================================

const isoDate = (d: Date) => {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
};

const todayIso = () => isoDate(new Date());
const daysAgoIso = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
};
const startOfYearIso = () => {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), 0, 1));
};
const last12MonthsIso = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 11);
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
};

const monthLabel = (yearMonth: string) => {
  const [y, m] = yearMonth.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
};

const compactNumber = (n: number) => {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
};

const sumAging = (b: FinanceAgingBuckets) =>
  b.current + b.d1To30 + b.d31To60 + b.d61To90 + b.d90Plus;

// =====================================================
// Page
// =====================================================

export default function FinanceReportsPage() {
  const { company } = useAuth();
  const currencyCode = company?.currency?.currencyCode;

  const [from, setFrom] = useState<string>(last12MonthsIso());
  const [to, setTo] = useState<string>(todayIso());
  const [appliedFrom, setAppliedFrom] = useState<string>(from);
  const [appliedTo, setAppliedTo] = useState<string>(to);

  const [data, setData] = useState<FinanceReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async (f: string, t: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getFinanceSummary(f, t);
      setData(res);
    } catch (err) {
      console.error("Failed to load finance summary", err);
      setError("Could not load finance reports");
      toast.error("Could not load finance reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSummary(appliedFrom, appliedTo);
  }, [appliedFrom, appliedTo]);

  const applyFilters = () => {
    if (from && to && from > to) {
      toast.error("From date must be before To date");
      return;
    }
    setAppliedFrom(from);
    setAppliedTo(to);
  };

  const resetFilters = () => {
    const f = last12MonthsIso();
    const t = todayIso();
    setFrom(f);
    setTo(t);
    setAppliedFrom(f);
    setAppliedTo(t);
  };

  const setQuickRange = (kind: "30" | "90" | "365" | "ytd") => {
    let f = last12MonthsIso();
    const t = todayIso();
    if (kind === "30") f = daysAgoIso(30);
    else if (kind === "90") f = daysAgoIso(90);
    else if (kind === "365") f = daysAgoIso(365);
    else if (kind === "ytd") f = startOfYearIso();
    setFrom(f);
    setTo(t);
    setAppliedFrom(f);
    setAppliedTo(t);
  };

  const exportCsv = () => {
    if (!data) return;
    const rows: string[][] = [];
    rows.push(["Metric", "Value"]);
    rows.push(["From", data.from]);
    rows.push(["To", data.to]);
    rows.push(["Revenue", String(data.totals.revenue)]);
    rows.push(["Expenses", String(data.totals.expenses)]);
    rows.push(["Net profit", String(data.totals.netProfit)]);
    rows.push([
      "Outstanding receivables",
      String(data.totals.totalReceivables),
    ]);
    rows.push(["Outstanding payables", String(data.totals.totalPayables)]);
    rows.push(["Cash inflow", String(data.totals.cashInflow)]);
    rows.push(["Cash outflow", String(data.totals.cashOutflow)]);
    rows.push(["Payroll cost", String(data.totals.payrollCost)]);
    rows.push([]);
    rows.push(["Top customers"]);
    rows.push(["Name", "Total amount", "Outstanding", "Invoices"]);
    data.topCustomers.forEach((c) =>
      rows.push([
        c.name,
        String(c.totalAmount),
        String(c.outstanding),
        String(c.invoiceCount),
      ]),
    );
    rows.push([]);
    rows.push(["Top vendors"]);
    rows.push(["Name", "Total amount", "Outstanding", "Invoices"]);
    data.topVendors.forEach((v) =>
      rows.push([
        v.name,
        String(v.totalAmount),
        String(v.outstanding),
        String(v.invoiceCount),
      ]),
    );

    const csv = rows
      .map((r) => r.map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-report-${data.from}-to-${data.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (v: number) => formatMoney(v, currencyCode);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Finance Reports"
        description="Profit & loss, receivables, payables, cash flow and payroll cost in one place."
        variant="darkBlue"
        icon={<PieChartIcon className="w-6 h-6" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchSummary(appliedFrom, appliedTo)}
              disabled={loading}
              className="border border-white/25 bg-white/15 text-white hover:bg-white/25 hover:text-white"
            >
              <RefreshCw
                className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={exportCsv}
              disabled={!data}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex-1">
            <div className="space-y-1.5">
              <Label htmlFor="finance-report-from">From</Label>
              <Input
                id="finance-report-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="finance-report-to">To</Label>
              <Input
                id="finance-report-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickChip onClick={() => setQuickRange("30")}>
              Last 30 days
            </QuickChip>
            <QuickChip onClick={() => setQuickRange("90")}>
              Last 90 days
            </QuickChip>
            <QuickChip onClick={() => setQuickRange("365")}>
              Last 365 days
            </QuickChip>
            <QuickChip onClick={() => setQuickRange("ytd")}>YTD</QuickChip>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={applyFilters} disabled={loading}>
              Apply
            </Button>
            <Button variant="outline" onClick={resetFilters} disabled={loading}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {loading ? (
        <KpiSkeleton />
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Revenue"
            value={fmt(data.totals.revenue)}
            icon={<TrendingUp className="h-4 w-4" />}
            accent="text-emerald-500"
            subtitle={`${data.totals.invoiceCount} invoices`}
          />
          <KpiCard
            label="Expenses"
            value={fmt(data.totals.expenses)}
            icon={<TrendingDown className="h-4 w-4" />}
            accent="text-rose-500"
          />
          <KpiCard
            label="Net Profit"
            value={fmt(data.totals.netProfit)}
            icon={
              data.totals.netProfit >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )
            }
            accent={
              data.totals.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
            }
          />
          <KpiCard
            label="Outstanding AR"
            value={fmt(data.totals.totalReceivables)}
            icon={<Users className="h-4 w-4" />}
            accent="text-blue-500"
            subtitle={`${data.arAging.currentCount + data.arAging.d1To30Count + data.arAging.d31To60Count + data.arAging.d61To90Count + data.arAging.d90PlusCount} open`}
          />
          <KpiCard
            label="Outstanding AP"
            value={fmt(data.totals.totalPayables)}
            icon={<Building2 className="h-4 w-4" />}
            accent="text-amber-500"
            subtitle={`${data.apAging.currentCount + data.apAging.d1To30Count + data.apAging.d31To60Count + data.apAging.d61To90Count + data.apAging.d90PlusCount} open`}
          />
          <KpiCard
            label="Payroll Cost"
            value={fmt(data.totals.payrollCost)}
            icon={<Wallet className="h-4 w-4" />}
            accent="text-purple-500"
          />
        </div>
      ) : null}

      {error && !loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : null}

      {/* Tabs */}
      {data && !loading ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="receivables">Receivables</TabsTrigger>
            <TabsTrigger value="payables">Payables</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="ledger">Income & Expense</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab data={data} fmt={fmt} />
          </TabsContent>
          <TabsContent value="receivables" className="space-y-4">
            <AgingTab
              title="Receivables aging"
              description="Outstanding sales invoices grouped by how many days they are past their due date."
              aging={data.arAging}
              parties={data.topCustomers}
              partyLabel="Top customers"
              fmt={fmt}
              accent="text-blue-500"
            />
          </TabsContent>
          <TabsContent value="payables" className="space-y-4">
            <AgingTab
              title="Payables aging"
              description="Outstanding purchase invoices grouped by how many days they are past their due date."
              aging={data.apAging}
              parties={data.topVendors}
              partyLabel="Top vendors"
              fmt={fmt}
              accent="text-amber-500"
            />
          </TabsContent>
          <TabsContent value="cashflow" className="space-y-4">
            <CashFlowTab data={data} fmt={fmt} />
          </TabsContent>
          <TabsContent value="ledger" className="space-y-4">
            <LedgerTab data={data} fmt={fmt} />
          </TabsContent>
        </Tabs>
      ) : loading ? (
        <ChartSkeleton />
      ) : null}
    </div>
  );
}

// =====================================================
// Subcomponents
// =====================================================

function QuickChip({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
    >
      {children}
    </button>
  );
}

function KpiCard({
  label,
  value,
  icon,
  accent,
  subtitle,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  subtitle?: string;
}) {
  return (
    <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full bg-muted/60 ${accent}`}
          >
            {icon}
          </span>
        </div>
        <p className="mt-3 text-xl font-semibold tabular-nums sm:text-2xl">
          {value}
        </p>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-7 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-72 w-full" />
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}

// ==================== Overview ====================

function OverviewTab({
  data,
  fmt,
}: {
  data: FinanceReportSummary;
  fmt: (v: number) => string;
}) {
  const series = useMemo(
    () =>
      data.revenueByMonth.map((p, idx) => ({
        month: monthLabel(p.yearMonth),
        revenue: p.value,
        expense: data.expenseByMonth[idx]?.value ?? 0,
      })),
    [data.revenueByMonth, data.expenseByMonth],
  );

  const config: ChartConfig = {
    revenue: { label: "Revenue", color: "hsl(142 76% 45%)" },
    expense: { label: "Expense", color: "hsl(0 78% 60%)" },
  };

  const expensePieData = data.expensesByAccount.slice(0, 6);
  const totalExpensePie = expensePieData.reduce((s, r) => s + r.amount, 0);
  const PIE_COLORS = [
    "hsl(220 83% 56%)",
    "hsl(142 76% 45%)",
    "hsl(38 92% 56%)",
    "hsl(280 70% 60%)",
    "hsl(0 78% 60%)",
    "hsl(190 80% 50%)",
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Revenue vs Expense</CardTitle>
          <CardDescription>
            Monthly trend across the selected window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <EmptyState message="No invoice data in this date range." />
          ) : (
            <ChartContainer config={config} className="h-72 w-full">
              <AreaChart data={series} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="hsl(142 76% 45%)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(142 76% 45%)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="hsl(0 78% 60%)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(0 78% 60%)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(v) => compactNumber(Number(v))}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        fmt(Number(value)),
                        String(name).charAt(0).toUpperCase() +
                          String(name).slice(1),
                      ]}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142 76% 45%)"
                  fill="url(#revFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="hsl(0 78% 60%)"
                  fill="url(#expFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            Expense breakdown
          </CardTitle>
          <CardDescription>Top expense categories.</CardDescription>
        </CardHeader>
        <CardContent>
          {expensePieData.length === 0 ? (
            <EmptyState message="No expense ledger data in this range." />
          ) : (
            <>
              <ChartContainer
                config={Object.fromEntries(
                  expensePieData.map((e, i) => [
                    e.accountName,
                    { label: e.accountName, color: PIE_COLORS[i] },
                  ]),
                )}
                className="mx-auto aspect-square max-h-64"
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
                    data={expensePieData}
                    dataKey="amount"
                    nameKey="accountName"
                    innerRadius="60%"
                    outerRadius="90%"
                    strokeWidth={2}
                  >
                    {expensePieData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <ul className="mt-3 space-y-1.5">
                {expensePieData.map((row, idx) => (
                  <li
                    key={row.accountName}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background: PIE_COLORS[idx % PIE_COLORS.length],
                        }}
                      />
                      <span className="truncate">{row.accountName}</span>
                    </span>
                    <span className="ml-2 shrink-0 font-medium tabular-nums">
                      {fmt(row.amount)}
                    </span>
                  </li>
                ))}
              </ul>
              {totalExpensePie > 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Top {expensePieData.length} accounts •{" "}
                  <span className="font-semibold text-foreground">
                    {fmt(totalExpensePie)}
                  </span>{" "}
                  total
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Aging (AR / AP) ====================

function AgingTab({
  title,
  description,
  aging,
  parties,
  partyLabel,
  fmt,
  accent,
}: {
  title: string;
  description: string;
  aging: FinanceAgingBuckets;
  parties: FinanceReportSummary["topCustomers"];
  partyLabel: string;
  fmt: (v: number) => string;
  accent: string;
}) {
  const data = [
    { bucket: "Current", amount: aging.current, count: aging.currentCount },
    { bucket: "1-30 days", amount: aging.d1To30, count: aging.d1To30Count },
    { bucket: "31-60 days", amount: aging.d31To60, count: aging.d31To60Count },
    { bucket: "61-90 days", amount: aging.d61To90, count: aging.d61To90Count },
    { bucket: "90+ days", amount: aging.d90Plus, count: aging.d90PlusCount },
  ];
  const total = sumAging(aging);
  const config: ChartConfig = {
    amount: { label: "Outstanding", color: "hsl(220 83% 56%)" },
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className={accent}>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <EmptyState message="Nothing outstanding." />
          ) : (
            <ChartContainer config={config} className="h-72 w-full">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => compactNumber(Number(v))}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="bucket"
                  width={88}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => fmt(Number(value))}
                    />
                  }
                />
                <Bar dataKey="amount" fill="hsl(220 83% 56%)" radius={6} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{partyLabel}</CardTitle>
          <CardDescription>Top 10 by total amount.</CardDescription>
        </CardHeader>
        <CardContent>
          {parties.length === 0 ? (
            <EmptyState message="No data." />
          ) : (
            <ul className="space-y-2">
              {parties.map((p) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between gap-3 rounded-md border bg-card p-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.invoiceCount} invoice{p.invoiceCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold tabular-nums">
                      {fmt(p.totalAmount)}
                    </span>
                    {p.outstanding > 0 ? (
                      <Badge variant="outline" className="mt-0.5 text-[10px]">
                        {fmt(p.outstanding)} open
                      </Badge>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Cash Flow ====================

function CashFlowTab({
  data,
  fmt,
}: {
  data: FinanceReportSummary;
  fmt: (v: number) => string;
}) {
  const merged = useMemo(
    () =>
      data.cashInflowByMonth.map((p, idx) => {
        const inflow = p.value;
        const outflow = data.cashOutflowByMonth[idx]?.value ?? 0;
        return {
          month: monthLabel(p.yearMonth),
          inflow,
          outflow,
          net: inflow - outflow,
        };
      }),
    [data.cashInflowByMonth, data.cashOutflowByMonth],
  );

  const netCash = data.totals.cashInflow - data.totals.cashOutflow;

  const config: ChartConfig = {
    inflow: { label: "Inflow", color: "hsl(142 76% 45%)" },
    outflow: { label: "Outflow", color: "hsl(0 78% 60%)" },
    net: { label: "Net", color: "hsl(220 83% 56%)" },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Inflow"
          value={fmt(data.totals.cashInflow)}
          icon={<Banknote className="h-4 w-4" />}
          accent="text-emerald-500"
        />
        <KpiCard
          label="Outflow"
          value={fmt(data.totals.cashOutflow)}
          icon={<Banknote className="h-4 w-4" />}
          accent="text-rose-500"
        />
        <KpiCard
          label="Net cash"
          value={fmt(netCash)}
          icon={
            netCash >= 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )
          }
          accent={netCash >= 0 ? "text-emerald-500" : "text-rose-500"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash flow by month</CardTitle>
          <CardDescription>
            Customer payments vs vendor payments across the selected window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {merged.length === 0 ? (
            <EmptyState message="No payment data in this range." />
          ) : (
            <ChartContainer config={config} className="h-80 w-full">
              <LineChart data={merged} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(v) => compactNumber(Number(v))}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        fmt(Number(value)),
                        String(name).charAt(0).toUpperCase() +
                          String(name).slice(1),
                      ]}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="inflow"
                  stroke="hsl(142 76% 45%)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="outflow"
                  stroke="hsl(0 78% 60%)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="hsl(220 83% 56%)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Income & Expense lists ====================

function LedgerTab({
  data,
  fmt,
}: {
  data: FinanceReportSummary;
  fmt: (v: number) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <RankedList
        title="Income by account"
        description="Credit-side ledger entries against revenue / income accounts."
        rows={data.incomeByAccount}
        fmt={fmt}
        bar="bg-emerald-500"
      />
      <RankedList
        title="Expenses by account"
        description="Debit-side ledger entries against expense / cost accounts."
        rows={data.expensesByAccount}
        fmt={fmt}
        bar="bg-rose-500"
      />
    </div>
  );
}

function RankedList({
  title,
  description,
  rows,
  fmt,
  bar,
}: {
  title: string;
  description: string;
  rows: FinanceReportSummary["expensesByAccount"];
  fmt: (v: number) => string;
  bar: string;
}) {
  const top = rows[0]?.amount ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState message="No ledger activity in this range." />
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const pct = top > 0 ? (r.amount / top) * 100 : 0;
              return (
                <li key={r.accountName}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-medium">
                      {r.accountName}
                      {r.accountCode ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {r.accountCode}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {fmt(r.amount)}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className={`mt-1.5 h-1.5 [&>div]:${bar}`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
