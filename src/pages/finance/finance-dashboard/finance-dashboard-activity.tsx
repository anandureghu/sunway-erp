import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatMoney } from "@/lib/utils";
import type {
  FinanceDashboardPendingApprovals,
  FinanceDashboardTransaction,
} from "@/types/financeDashboard";
import {
  BookOpen,
  ClipboardList,
  FileText,
  ShoppingCart,
} from "lucide-react";
import { formatShortDate } from "./finance-dashboard-utils";
import { DashboardViewAllLink } from "./finance-dashboard-view-all";

const APPROVAL_ITEMS: {
  key: keyof FinanceDashboardPendingApprovals;
  label: string;
  icon: typeof FileText;
  color: string;
  to: string;
}[] = [
  {
    key: "purchaseRequisitions",
    label: "Purchase Requisitions",
    icon: ClipboardList,
    color: "bg-violet-100 text-violet-700",
    to: "/inventory/purchase/requisitions",
  },
  {
    key: "purchaseOrders",
    label: "Purchase Orders",
    icon: ShoppingCart,
    color: "bg-blue-100 text-blue-700",
    to: "/inventory/purchase/orders",
  },
  {
    key: "paymentRequests",
    label: "Payment Requests",
    icon: FileText,
    color: "bg-amber-100 text-amber-800",
    to: "/finance/payable",
  },
  {
    key: "journalEntries",
    label: "Journal Entries",
    icon: BookOpen,
    color: "bg-emerald-100 text-emerald-700",
    to: "/finance/ledger",
  },
];

export function PendingApprovalsCard({
  pendingApprovals,
}: {
  pendingApprovals: FinanceDashboardPendingApprovals | null;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Pending Approvals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {APPROVAL_ITEMS.map((item) => {
          const count = pendingApprovals?.[item.key] ?? 0;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.to}
              className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  item.color,
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {item.label}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums">
                {count}
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function RecentTransactionsCard({
  transactions,
  currencyCode,
}: {
  transactions: FinanceDashboardTransaction[];
  currencyCode?: string;
}) {
  const fmt = (v: number) => formatMoney(v, currencyCode);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Recent Transactions</CardTitle>
        <DashboardViewAllLink to="/finance/ledger" />
      </CardHeader>
      <CardContent className="space-y-2">
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recent transactions.
          </p>
        ) : (
          transactions.slice(0, 6).map((tx) => (
            <div
              key={`${tx.transactionCode}-${tx.transactionDate}`}
              className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {tx.transactionType || tx.transactionCode}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {tx.description || tx.transactionCode}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatShortDate(tx.transactionDate)}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  tx.amount >= 0 ? "text-emerald-600" : "text-red-600",
                )}
              >
                {tx.amount >= 0 ? "+" : ""}
                {fmt(tx.amount)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
