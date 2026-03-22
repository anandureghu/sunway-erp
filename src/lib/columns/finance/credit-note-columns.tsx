import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { CreditNote } from "@/types/credit-note";
import { StatusBadge } from "@/lib/status-badge";
import { CreditAmount } from "@/components/accounting-amount";

export const CREDIT_NOTE_COLUMNS: ColumnDef<CreditNote>[] = [
  {
    accessorKey: "creditNoteNumber",
    header: "Credit Note #",
  },
  {
    accessorKey: "creditNoteDate",
    header: "Credit Note Date",
    cell: ({ row }) =>
      format(new Date(row.original.creditNoteDate), "dd MMM yyyy"),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "project",
    header: "Project",
    cell: ({ row }) => row.original.project ?? "—",
  },
  {
    accessorKey: "referenceNumber",
    header: "Reference #",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <CreditAmount amount={row.original.amount} currencyCode="₹" />
    ),
  },
  {
    accessorKey: "remainingAmount",
    header: "Remaining Amount",
    cell: ({ row }) => (
      <CreditAmount amount={row.original.remainingAmount} currencyCode="₹" />
    ),
  },
];
