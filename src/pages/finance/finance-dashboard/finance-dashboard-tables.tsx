import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/utils";
import type {
  FinanceDashboardBudgetRow,
  FinanceDashboardOverdueRow,
} from "@/types/financeDashboard";
import { formatShortDate } from "./finance-dashboard-utils";
import { DashboardViewAllLink } from "./finance-dashboard-view-all";

function EmptyRows({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center text-sm text-muted-foreground"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}

export function FinanceDashboardTables({
  overdueReceivables,
  payablesDue,
  budgets,
  currencyCode,
  loading,
}: {
  overdueReceivables: FinanceDashboardOverdueRow[];
  payablesDue: FinanceDashboardOverdueRow[];
  budgets: FinanceDashboardBudgetRow[];
  currencyCode?: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-xl" />
        ))}
      </div>
    );
  }

  const fmt = (v: number) => formatMoney(v, currencyCode);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Overdue Receivables</CardTitle>
          <DashboardViewAllLink to="/finance/receivable" />
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Inv No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
                <TableHead className="pr-6 text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueReceivables.length === 0 ? (
                <EmptyRows colSpan={5} message="No overdue receivables." />
              ) : (
                overdueReceivables.map((row) => (
                  <TableRow key={row.invoiceId}>
                    <TableCell className="pl-6 font-medium">
                      {row.invoiceId}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {row.party}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatShortDate(row.dueDate)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {row.daysOverdue}d
                    </TableCell>
                    <TableCell className="pr-6 text-right tabular-nums">
                      {fmt(row.outstanding)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Top Payables Due</CardTitle>
          <DashboardViewAllLink to="/finance/payable" />
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Bill No.</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="pr-6 text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payablesDue.length === 0 ? (
                <EmptyRows colSpan={4} message="No payables due." />
              ) : (
                payablesDue.map((row) => (
                  <TableRow key={row.invoiceId}>
                    <TableCell className="pl-6 font-medium">
                      {row.invoiceId}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {row.party}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatShortDate(row.dueDate)}
                    </TableCell>
                    <TableCell className="pr-6 text-right tabular-nums">
                      {fmt(row.outstanding)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Budget by Department</CardTitle>
          <DashboardViewAllLink to="/finance/ledger?tab=budget" />
        </CardHeader>
        <CardContent className="space-y-4">
          {budgets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No department budgets.
            </p>
          ) : (
            budgets.map((row) => (
              <div key={row.departmentId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">
                    {row.departmentName}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {Math.round(row.utilizationPercent)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(100, Math.max(0, row.utilizationPercent))}
                  className="h-2"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Used {fmt(row.spent)}</span>
                  <span>Budget {fmt(row.budgeted)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
