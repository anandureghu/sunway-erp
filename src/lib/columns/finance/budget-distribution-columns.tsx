import type { ColumnDef } from "@tanstack/react-table";
import type { BudgetDistributionResponseDTO } from "@/types/budget";
import type { Company } from "@/types/company";
import { CreditAmount } from "@/components/accounting-amount";
import { Badge } from "@/components/ui/badge";

export const BUDGET_DISTRIBUTION_COLUMNS = (
  company: Company,
): ColumnDef<BudgetDistributionResponseDTO>[] => [
  {
    header: "Date Posted",
    accessorKey: "transactionDate",
    cell: ({ row }) =>
      row.original.transactionDate
        ? new Date(row.original.transactionDate).toLocaleDateString()
        : "—",
  },
  {
    header: "Credit Account",
    accessorKey: "creditAccountName",
    cell: ({ row }) => {
      const name = row.original.creditAccountName;
      const code = row.original.creditAccountCode;
      return name ? (
        <span>
          {name}
          {code && (
            <span className="ml-1 font-mono text-xs text-muted-foreground">
              ({code})
            </span>
          )}
        </span>
      ) : (
        "—"
      );
    },
  },
  {
    header: "Amount",
    accessorKey: "amount",
    cell: ({ row }) => (
      <CreditAmount
        amount={Number(row.original.amount)}
        currencyCode={company.currency?.currencyCode}
      />
    ),
  },
  {
    header: "Remarks",
    accessorKey: "transactionDescription",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
        {row.original.transactionDescription ?? "—"}
      </span>
    ),
  },
  {
    header: "Modified By",
    accessorKey: "createdByUserName",
    cell: ({ row }) =>
      row.original.createdByUserName ??
      (row.original.createdByUserId
        ? `User #${row.original.createdByUserId}`
        : "—"),
  },
  {
    header: "Status",
    accessorKey: "archived",
    cell: ({ row }) =>
      row.original.archived ? (
        <Badge variant="secondary">Archived</Badge>
      ) : (
        <Badge variant="outline">Active</Badge>
      ),
  },
];
