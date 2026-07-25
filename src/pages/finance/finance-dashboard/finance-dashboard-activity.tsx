import {
  DashboardCountListCard,
  DashboardEmpty,
  DashboardSectionCard,
  formatShortDate,
} from "@/components/dashboard";
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

export function PendingApprovalsCard({
  pendingApprovals,
}: {
  pendingApprovals: FinanceDashboardPendingApprovals | null;
}) {
  return (
    <DashboardCountListCard
      title="Pending Approvals"
      items={[
        {
          key: "purchaseRequisitions",
          label: "Purchase Requisitions",
          count: pendingApprovals?.purchaseRequisitions ?? 0,
          icon: ClipboardList,
          color: "bg-violet-100 text-violet-700",
          to: "/inventory/purchase/requisitions",
        },
        {
          key: "purchaseOrders",
          label: "Purchase Orders",
          count: pendingApprovals?.purchaseOrders ?? 0,
          icon: ShoppingCart,
          color: "bg-blue-100 text-blue-700",
          to: "/inventory/purchase/orders",
        },
        {
          key: "paymentRequests",
          label: "Payment Requests",
          count: pendingApprovals?.paymentRequests ?? 0,
          icon: FileText,
          color: "bg-amber-100 text-amber-800",
          to: "/finance/payable",
        },
        {
          key: "journalEntries",
          label: "Journal Entries",
          count: pendingApprovals?.journalEntries ?? 0,
          icon: BookOpen,
          color: "bg-emerald-100 text-emerald-700",
          to: "/finance/ledger",
        },
      ]}
    />
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
    <DashboardSectionCard
      title="Recent Transactions"
      viewAllTo="/finance/ledger"
    >
      {transactions.length === 0 ? (
        <DashboardEmpty message="No recent transactions." />
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 6).map((tx) => (
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
          ))}
        </div>
      )}
    </DashboardSectionCard>
  );
}
