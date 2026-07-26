import {
  DashboardCardSkeletonGrid,
  DashboardProgressListCard,
  DashboardSectionCard,
  formatShortDate,
} from "@/components/dashboard";
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
      <DashboardCardSkeletonGrid
        count={3}
        className="xl:grid-cols-3"
      />
    );
  }

  const fmt = (v: number) => formatMoney(v, currencyCode);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <DashboardSectionCard
        title="Overdue Receivables"
        viewAllTo="/finance/receivable"
        contentClassName="overflow-x-auto px-0"
      >
        <Table className="[&_tbody_tr:nth-child(even)]:bg-slate-50/50">
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
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Top Payables Due"
        viewAllTo="/finance/payable"
        contentClassName="overflow-x-auto px-0"
      >
        <Table className="[&_tbody_tr:nth-child(even)]:bg-slate-50/50">
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
      </DashboardSectionCard>

      <DashboardProgressListCard
        title="Budget by Department"
        viewAllTo="/finance/ledger?tab=budget"
        emptyMessage="No department budgets."
        rows={budgets.map((row) => ({
          id: row.departmentId,
          label: row.departmentName,
          percent: row.utilizationPercent,
          leftHint: `Used ${fmt(row.spent)}`,
          rightHint: `Budget ${fmt(row.budgeted)}`,
        }))}
      />
    </div>
  );
}
